"""
Transforma os diplomas da escola (.docx feitos em mala direta no Word) nos modelos que o painel
preenche: troca os dados do aluno, da escola e do curso por marcadores {{chave}} e as listas
do verso (disciplinas, carga horária e perfil) por {{#chave}}, que o painel repete por item.

Também tira os objetos OLE (o brasão do Paint, ~7 MB) e mantém a imagem deles.

Uso (precisa de lxml):
    python3 scripts/diploma_modelo.py <tipo> origem.docx public/diploma-<tipo>.docx

Tipos e arquivos de origem enviados pela escola:
    integrado               Diploma_FAR_integrado_2023-2025.docx (serve também para Nutrição)
    farmacia-subsequente    Diploma_FAR_Subsequente_2025.1teste.docx
    enfermagem-subsequente  MODELO_DE_DIPLOMA_SUBSEQUENTE_-_ENFERMAGEM-24.1teste.doc
                            (convertido antes: soffice --headless --convert-to docx arquivo.doc)

Os textos de exemplo de cada modelo (nome do aluno, datas...) estão nas funções abaixo: se a
escola trocar um modelo, eles precisam ser os do novo arquivo.
"""

import re
import sys
import zipfile

from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
O = 'urn:schemas-microsoft-com:office:office'
NS = {'w': W, 'o': O}
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'


def q(tag):
    p, t = tag.split(':')
    return '{%s}%s' % (NS[p], t)


def runs(p):
    return [r for r in p.iter(q('w:r'))]


def run_text(r):
    return ''.join(t.text or '' for t in r.findall(q('w:t')))


def para_text(p):
    return ''.join(run_text(r) for r in p.findall(q('w:r')))


def set_run_text(r, text):
    ts = r.findall(q('w:t'))
    if not ts:
        t = etree.SubElement(r, q('w:t'))
        ts = [t]
    ts[0].text = text
    ts[0].set(XML_SPACE, 'preserve')
    for t in ts[1:]:
        r.remove(t)


def replace_span(p, old, new):
    """Troca `old` por `new` no parágrafo, mesmo que `old` esteja espalhado em várias runs.
    O texto novo fica na primeira run (com a formatação dela)."""
    rs = [r for r in p.findall(q('w:r')) if r.findall(q('w:t'))]
    full = ''.join(run_text(r) for r in rs)
    i = full.find(old)
    if i < 0:
        return False
    j = i + len(old)
    pos = 0
    placed = False
    for r in rs:
        t = run_text(r)
        a, b = pos, pos + len(t)
        pos = b
        if b <= i or a >= j:
            continue
        keep_before = t[: max(0, i - a)]
        keep_after = t[max(0, j - a):] if j < b else ''
        if not placed:
            set_run_text(r, keep_before + new + keep_after)
            placed = True
        else:
            set_run_text(r, keep_after)
    return True


def remove_fields(root):
    """Tira os campos de mala direta (MERGEFIELD), deixando só o texto de exemplo."""
    for r in list(root.iter(q('w:r'))):
        if r.find(q('w:fldChar')) is not None or r.find(q('w:instrText')) is not None:
            r.getparent().remove(r)


def paras(root):
    return list(root.iter(q('w:p')))


def find_para(root, text, nth=0, exact=True):
    found = [p for p in paras(root) if (para_text(p).strip() == text if exact else text in para_text(p))]
    if len(found) <= nth:
        raise SystemExit('Não achei o parágrafo: %r (#%d)' % (text, nth))
    return found[nth]


def sub(root, para, old, new):
    """No primeiro parágrafo que contém `para` e `old`, troca `old` por `new`."""
    for p in paras(root):
        t = para_text(p)
        if para in t and old in t:
            replace_span(p, old, new)
            return
    raise SystemExit('Não achei %r em %r' % (old, para))


def whole(root, text, key, nth=0):
    p = find_para(root, text, nth)
    if not replace_span(p, para_text(p).strip(), '{{%s}}' % key):
        raise SystemExit('Falhou: %r' % text)


def cells(root):
    return list(root.iter(q('w:tc')))


def make_list(root, first_texts, key, length=None):
    """Na célula cujos parágrafos com texto começam por `first_texts`, deixa só o primeiro
    parágrafo com texto, com {{#key}}, e apaga os outros (e os vazios entre eles)."""
    for tc in cells(root):
        ps = [p for p in tc.findall(q('w:p'))]
        texts = [para_text(p) for p in ps if para_text(p).strip()]
        if texts[: len(first_texts)] != first_texts:
            continue
        if length is not None and len(texts) != length:
            continue
        first = next(p for p in ps if para_text(p).strip() == first_texts[0].strip())
        rs = [r for r in first.findall(q('w:r')) if r.findall(q('w:t'))]
        set_run_text(rs[0], '{{#%s}}' % key)
        for r in rs[1:]:
            first.remove(r)
        after = False
        for p in ps:
            if p is first:
                after = True
                continue
            if after:
                tc.remove(p)
        return
    raise SystemExit('Não achei a lista %r' % first_texts)


def make_perfil(root, intro_text, old_title):
    """Perfil do profissional: o nome do curso na introdução vira {{titulo}} e os itens viram
    {{#perfil}}. Mantém o que vem antes do texto do item (ex.: o "- " do Integrado) e apaga
    os outros itens (e os parágrafos vazios entre eles: o painel repõe)."""
    intro = find_para(root, intro_text, exact=False)
    if not replace_span(intro, old_title, 'Curso {{titulo}}'):
        raise SystemExit('Título não achado no perfil')
    tc = intro.getparent()
    ps = tc.findall(q('w:p'))
    start = ps.index(intro)
    items = [p for p in ps[start + 1:] if para_text(p).strip()]
    first = items[0]
    rs = [r for r in first.findall(q('w:r')) if r.findall(q('w:t'))]
    keep = 1 if run_text(rs[0]).strip() == '-' else 0
    set_run_text(rs[keep], '{{#perfil}}')
    for r in rs[keep + 1:]:
        first.remove(r)
    after = False
    for p in ps:
        if p is first:
            after = True
            continue
        if after:
            tc.remove(p)


def header_and_signatures(root):
    """Cabeçalho e assinaturas: iguais nos três modelos."""
    whole(root, 'Secretaria de Educação do Estado de Pernambuco', 'cab_secretaria')
    whole(root, 'Gerência Regional de Educação Metropolitana Norte', 'cab_gerencia')
    whole(root, 'ESCOLA TÉCNICA ESTADUAL CHICO SCIENCE', 'cab_escola')
    for start, key in [
        ('Avenida Brasil, s/n', 'cab_endereco'),
        ('Decreto Lei Estadual', 'cab_atos'),
        ('redenciamento do curso', 'portaria_curso'),
    ]:
        p = next(p for p in paras(root) if start.lower() in para_text(p).lower())
        whole(root, para_text(p).strip(), key)
    for _ in (0, 1):
        whole(root, 'Doriane Cristina Clemente Batista', 'sec_nome')
        whole(root, 'José Roberto Lima Miranda', 'dir_nome')
        whole(root, 'Diretor', 'dir_cargo')
        whole(root, 'Secretária', 'sec_cargo')
    # Frente: "ato - publicação" (o modelo de Farmácia Subsequente repetia a portaria da
    # secretária na linha do diretor; vale o ato do diretor).
    front = [p for p in paras(root) if ' - ' in para_text(p) and 'D.O.' in para_text(p) and 'Decreto' not in para_text(p)]
    sec, dire = front[0], front[1]
    for p, ato, do in [(sec, 'sec_ato', 'sec_do'), (dire, 'dir_ato', 'dir_do')]:
        rs = [r for r in p.findall(q('w:r')) if r.findall(q('w:t'))]
        set_run_text(rs[0], '{{%s}} - {{%s}}' % (ato, do))
        for r in rs[1:]:
            p.remove(r)
    # Verso.
    whole(root, 'Portaria SEE/SEGP nº 7580 de 09/09/2025', 'sec_ato')
    whole(root, 'ATO nº 5343 de 09/07/2024', 'dir_ato')
    sub(root, 'Publica', 'D.O. de 10/09/2025', '{{sec_do}}')
    sub(root, 'Publica', 'D.O. de 10/07/2024', '{{dir_do}}')
    sub(root, '85021701', '85021701', '{{sec_matricula}}')
    sub(root, '115962301', '115962301', '{{dir_matricula}}')


def check_left(out, words):
    left = [w for w in words if w.encode() in out]
    if left:
        raise SystemExit('Sobrou texto de exemplo: %r' % left)


def transform_integrado(root):
    """Integrado (Farmácia e Nutrição e Dietética usam o mesmo modelo)."""

    header_and_signatures(root)

    # Texto da frente.
    body = 'A Direção da '
    for old, key in [
        ('Escola Técnica Estadual Chico Science', 'escola_nome'),
        ('49279/109068309CM', 'sistec'),
        ('Técnico em Farmácia', 'titulo'),
        ('ADNA KÁSSIA SERPA TABOSA', 'nome'),
        ('ESDRAS SERPA TABOSA DA SILVA e SIMONE IVANILDA DA SILVA TABOSA', 'filiacao'),
        ('RECIFE-PERNAMBUCO', 'naturalidade'),
        ('BRASIL;', '{{nacionalidade}};'),
        ('08/07/2008', 'nascimento'),
        ('10900092', 'rg'),
        ('SDS-PE', 'rg_orgao'),
        ('138.891.704-12', 'cpf'),
        ('31 de dezembro de 2025', 'conclusao_data'),
        ('Ensino Médio Integral, Integrado à Educação Profissional', 'conclusao_texto'),
        ('Ambiente e Saúde', 'eixo'),
    ]:
        sub(root, body, old, key if key.startswith('{{') else '{{%s}}' % key)

    # Verso: escola anterior e registro.
    sub(root, 'ESCOLA ANTERIOR:', 'COLÉGIO 2001 LTDA', '{{ant_escola}}')
    sub(root, 'ANO DA CONCLUSÃO:', '2022', '{{ant_ano}}')
    sub(root, 'CIDADE:', 'OLINDA', '{{ant_cidade}}')
    sub(root, 'CIDADE:', 'PERNAMBUCO', '{{ant_uf}}')
    sub(root, 'CIDADE:', 'ENSINO FUNDAMENTAL', '{{ant_habilitacao}}')
    sub(root, 'Nome: ', 'ADNA KÁSSIA SERPA TABOSA', '{{nome}}')
    sub(root, 'SISTEC: ', '49279/109068309CM', '{{sistec}}')
    sub(root, 'Registro Escolar nº', '155', '{{registro}}')
    sub(root, 'Folha:', '52', '{{folha}}')
    sub(root, 'Livro:', '01', '{{livro}}')
    sub(root, 'Olinda,', 'Olinda', '{{cidade}}')
    sub(root, '{{cidade}},', '31 de dezembro de 2025', '{{conclusao_data}}')

    # Verso: tabela de disciplinas (4 blocos).
    whole(root, 'FORMAÇÃO GERAL BÁSICA', 'b1_sigla')
    whole(root, 'IF-AC', 'b2_sigla')
    whole(root, 'IF-EPT', 'b3_sigla')
    whole(root, 'IF-EPT', 'b4_sigla')
    whole(root, 'FORMAÇÃO GERAL BÁSICA (FGB/BNCC)', 'b1_titulo')
    whole(root, 'ITINERÁRIO FORMATIVO | ÁREA DO CONHECIMENTO', 'b2_titulo')
    whole(root, 'ITINERÁRIO FORMATIVO | EPT | FORMAÇÃO BÁSICA PARA O TRABALHO', 'b3_titulo')
    whole(root, 'ITINERÁRIO FORMATIVO | EPT | FORMAÇÃO PROFISSIONAL ESPECÍFICA', 'b4_titulo')
    whole(root, '2880', 'b1_total')
    whole(root, '2040', 'b2_total')
    whole(root, '400', 'b3_total')
    whole(root, '800', 'b4_total')
    whole(root, '5400', 'ch_total')
    make_list(root, ['Biologia'], 'b1_nomes')
    make_list(root, ['240', '240', '520'], 'b1_ch')
    make_list(root, ['Eletivas '], 'b2_nomes')
    make_list(root, ['320', '240', '640'], 'b2_ch')
    make_list(root, ['Design thinking'], 'b3_nomes')
    make_list(root, ['40', '40', '40'], 'b3_ch', 14)
    make_list(root, ['Bioética, Legislação Farmacêutica e Sanitária '], 'b4_nomes')
    make_list(root, ['80 ', '80 '], 'b4_ch')
    make_perfil(root, 'deverá ser capaz de', 'Curso Técnico em Farmácia')
    return ['ADNA', 'ESDRAS', '49279', 'Doriane', 'Farmácia']


def front_subsequente(root, ex):
    """Frente dos dois modelos do Subsequente: troca os dados de exemplo `ex`."""
    body = 'A Direção da '
    for old, new in ex:
        sub(root, body, old, new)


def back_subsequente(root, ex):
    for para, old, new in ex:
        sub(root, para, old, new)


def transform_farmacia_subsequente(root):
    header_and_signatures(root)
    front_subsequente(root, [
        ('Escola Técnica Estadual Chico Science', '{{escola_nome}}'),
        ('55348/129882969CM', '{{sistec}}'),
        ('Técnico em Farmácia a', '{{titulo}} a'),
        ('JOSIENE TEIXEIRA VASCONCELOS', '{{nome}}'),
        ('IVALDO TEIXEIRA VASCONCELOS e MARIA DE LOURDES VASCONCELOS', '{{filiacao}}'),
        ('PAULISTA - PERNAMBUCO', '{{naturalidade}}'),
        ('BRASILEIRA', '{{nacionalidade}}'),
        ('23/05/1978', '{{nascimento}}'),
        ('5.546.097', '{{rg}}'),
        ('SSP/PE', '{{rg_orgao}}'),
        ('031.879.954-54', '{{cpf}}'),
        ('09 de julho de 2026', '{{conclusao_data}}'),
        ('Educação Profissional Técnico em Farmácia na forma Subsequente', '{{conclusao_texto}}'),
        ('Ambiente e Saúde', '{{eixo}}'),
    ])
    sub(root, 'Olinda, ', 'Olinda', '{{cidade}}')
    sub(root, '{{cidade}}, ', '09 de julho de 2026', '{{conclusao_data}}')
    back_subsequente(root, [
        ('ESCOLA ANTERIOR:', 'COLÉGIO FERNANDO FERRARI', '{{ant_escola}}'),
        ('ANO DA CONCLUSÃO:', '1997', '{{ant_ano}}'),
        ('ANO DA CONCLUSÃO:', 'DADE:', 'CIDADE:'),
        ('ANO DA CONCLUSÃO:', 'OLINDA', '{{ant_cidade}}'),
        ('ANO DA CONCLUSÃO:', 'PERNAMBUCO', '{{ant_uf}}'),
        ('HABILITAÇÃO:', 'ENSINO MÉDIO COMPLETO', '{{ant_habilitacao}}'),
        ('Nome:', 'JOSIENE TEIXEIRA VASCONCELOS', '{{nome}}'),
        ('SISTEC: ', '55348/129882969CM', '{{sistec}}'),
        ('Registro Escolar nº', '206', '{{registro}}'),
        ('Folha:', '69', '{{folha}}'),
        ('Livro:', '01', '{{livro}}'),
        ('Olinda,09', 'Olinda,', '{{cidade}}, '),
        ('{{cidade}}, ', '09 de julho de 2026', '{{conclusao_data}}'),
    ])
    for n, roman, total in [(1, 'I', '600'), (2, 'II', '720'), (3, 'III', '600')]:
        whole(root, 'Módulo ' + roman, 'b%d_sigla' % n)
        whole(root, 'TOTAL DA C.H. MÓDULO ' + roman, 'b%d_titulo' % n)
        whole(root, total, 'b%d_total' % n)
    whole(root, '1920', 'ch_total')
    make_list(root, ['Anatomia, Fisiologia e Patologia Geral'], 'b1_nomes')
    make_list(root, ['80', '80', '40'], 'b1_ch')
    make_list(root, ['Atividades Complementares II'], 'b2_nomes')
    make_list(root, ['80', '80', '80'], 'b2_ch')
    make_list(root, ['Assistência Farmacêutica e Hospitalar'], 'b3_nomes')
    make_list(root, ['40', '80', '80'], 'b3_ch')
    make_perfil(root, 'será capaz de', 'Curso Técnico em Farmácia')
    return ['JOSIENE', 'IVALDO', '55348', 'Doriane', 'Farmácia', 'DADE: ']


def transform_enfermagem_subsequente(root):
    header_and_signatures(root)
    front_subsequente(root, [
        ('Escola Técnica Estadual Chico Science', '{{escola_nome}}'),
        ('49136/117465422CM', '{{sistec}}'),
        ('Técnico em Enfermagem a', '{{titulo}} a'),
        ('RAYANA DOS SANTOS DE LIMA', '{{nome}}'),
        ('FABIO SANDRO FRANCISCO DE LIMA e LUCIANA MARIA DOS SANTOS', '{{filiacao}}'),
        ('IGARASSU, UF: PERNAMBUCO', '{{naturalidade}}'),
        ('Nacionalidade Brasileira', 'Nacionalidade {{nacionalidade}}'),
        ('12 DE JULHO DE 2005', '{{nascimento}}'),
        ('11987008', '{{rg}}'),
        ('expedidor  SDS/PE', 'expedidor: {{rg_orgao}}'),
        ('171.858.814-39', '{{cpf}}'),
        ('9 de setembro de 2026', '{{conclusao_data}}'),
        ('Educação Profissional Técnico em Enfermagem na forma subsequente', '{{conclusao_texto}}'),
        ('Ambiente e Saúde', '{{eixo}}'),
    ])
    back_subsequente(root, [
        ('ESCOLA ANTERIOR:', 'ESCOLA DE REFERENCIA EM ENSINO MÉDIO JOÃO PESSOA GUERRA', '{{ant_escola}}'),
        ('ANO DE CONCLUSÃO:', '2023', '{{ant_ano}}'),
        ('ANO DE CONCLUSÃO:', 'IGARASSU', '{{ant_cidade}}'),
        ('ANO DE CONCLUSÃO:', 'PERNAMBUCO', '{{ant_uf}}'),
        ('HABILITAÇÃO:', 'ENSINO MÉDIO', '{{ant_habilitacao}}'),
        ('Nome:', 'RAYANA DOS SANTOS DE LIMA', '{{nome}}'),
        ('SISTEC: ', '49136/117465422CM', '{{sistec}}'),
        ('Registro Escolar nº', '155', '{{registro}}'),
        ('Folha ', '52', '{{folha}}'),
        ('Livro ', '01', '{{livro}}'),
        ('Olinda-PE,', 'Olinda-PE', '{{cidade}}'),
        ('{{cidade}}, ', '9 de setembro de 2026', '{{conclusao_data}}'),
    ])
    for n, sem, freq in [(1, '2024.1', '87,50'), (2, '2024.2', '87,33'), (3, '2025.1', '82,88'), (4, '2025.2', '87,00')]:
        whole(root, sem, 'b%d_semestre' % n)
        whole(root, freq, 'b%d_freq' % n)
    for old, key in [('267h', 'est_h'), ('400h/a', 'est_ha'), ('1600h', 'teo_h'), ('2.400h/a', 'teo_ha'), ('1.867h', 'tot_h'), ('2.800h/a', 'tot_ha')]:
        p = next(p for p in paras(root) if para_text(p).strip().rstrip('*') == old)
        replace_span(p, old, '{{%s}}' % key)
    make_list(root, ['Atividades Complementares I'], 'b1_nomes')
    make_list(root, ['80', '40', '80', '80'], 'b1_ch')
    make_list(root, ['Assistência de Enfermagem às principais Patologias'], 'b2_nomes')
    make_list(root, ['120', '80', '40', '120'], 'b2_ch')
    make_list(root, ['Atividades Complementares III'], 'b3_nomes')
    make_list(root, ['80', '80', '80', '60'], 'b3_ch')
    make_list(root, ['Administração em Enfermagem'], 'b4_nomes')
    make_list(root, ['80', '80', '80', '80', '80', '40'], 'b4_ch')
    make_perfil(root, 'será capaz de', 'Curso Técnico em Enfermagem')
    return ['RAYANA', 'FABIO', '49136', 'Doriane', 'Enfermagem']


MODELOS = {
    'integrado': transform_integrado,
    'farmacia-subsequente': transform_farmacia_subsequente,
    'enfermagem-subsequente': transform_enfermagem_subsequente,
}


def transform(doc, tipo):
    root = etree.fromstring(doc)
    remove_fields(root)
    for ole in list(root.iter(q('o:OLEObject'))):
        ole.getparent().remove(ole)
    words = MODELOS[tipo](root)
    out = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    check_left(out, words)
    return out


def main(tipo, src, dst):
    zin = zipfile.ZipFile(src)
    zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename.startswith('word/embeddings/'):
            continue
        if item.filename == 'word/document.xml':
            data = transform(data, tipo)
        elif item.filename == 'word/_rels/document.xml.rels':
            data = re.sub(rb'<Relationship [^>]*oleObject[^>]*/>', b'', data)
        elif item.filename == '[Content_Types].xml':
            data = re.sub(rb'<Default Extension="bin"[^>]*/>', b'', data)
        zout.writestr(item, data)
    zout.close()


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
