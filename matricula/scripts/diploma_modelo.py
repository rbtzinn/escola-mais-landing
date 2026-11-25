"""
Transforma o diploma da escola (.docx feito em mala direta no Word) no modelo que o painel
preenche: troca os dados do aluno, da escola e do curso por marcadores {{chave}} e as listas
do verso (disciplinas, carga horária e perfil) por {{#chave}}, que o painel repete por item.

Também tira os objetos OLE (o brasão do Paint, ~7 MB) e mantém a imagem deles.

Uso (precisa de lxml):
    python3 scripts/diploma_modelo.py caminho/do/diploma.docx public/diploma-modelo.docx

O modelo de origem é o "Diploma_FAR_integrado_2023-2025.docx". Se a escola trocar o modelo,
os textos de exemplo abaixo (nome da aluna, datas...) precisam ser os do novo arquivo.
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


def sub(root, para, old, new, nth=0, exact=False):
    p = find_para(root, para, nth, exact)
    if not replace_span(p, old, new):
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


def make_perfil(root):
    """Perfil do profissional: intro com o nome do curso e os itens "- ..." viram {{#perfil}}."""
    intro = find_para(root, 'deverá ser capaz de', exact=False)
    replace_span(intro, 'Curso Técnico em Farmácia', 'Curso {{titulo}}')
    tc = intro.getparent()
    ps = tc.findall(q('w:p'))
    items = [p for p in ps if para_text(p).startswith('- ')]
    first = items[0]
    rs = [r for r in first.findall(q('w:r')) if r.findall(q('w:t'))]
    set_run_text(rs[-1], '{{#perfil}}')
    for r in rs[:-1]:
        first.remove(r)
    after = False
    for p in ps:
        if p is first:
            after = True
            continue
        if after:
            tc.remove(p)


def transform(doc):
    root = etree.fromstring(doc)
    remove_fields(root)
    for ole in list(root.iter(q('o:OLEObject'))):
        ole.getparent().remove(ole)

    # Cabeçalho (configurável no painel).
    whole(root, 'Secretaria de Educação do Estado de Pernambuco', 'cab_secretaria')
    whole(root, 'Gerência Regional de Educação Metropolitana Norte', 'cab_gerencia')
    whole(root, 'ESCOLA TÉCNICA ESTADUAL CHICO SCIENCE', 'cab_escola')
    for start, key in [
        ('Avenida Brasil, s/n', 'cab_endereco'),
        ('Decreto Lei Estadual', 'cab_atos'),
        ('PORTARIA DE CREDENCIAMENTO', 'portaria_curso'),
    ]:
        whole(root, para_text(find_para(root, start, exact=False)).strip(), key)

    # Texto da frente.
    body = 'A Direção da '
    for old, key in [
        ('Escola Técnica Estadual Chico Science', 'escola_nome'),
        ('49279/109068309CM', 'sistec'),
        ('Técnico em Farmácia', 'titulo'),
        ('ADNA KÁSSIA SERPA TABOSA', 'nome'),
        ('ESDRAS SERPA TABOSA DA SILVA e SIMONE IVANILDA DA SILVA TABOSA', 'filiacao'),
        ('RECIFE-PERNAMBUCO', 'naturalidade'),
        ('BRASIL', 'nacionalidade'),
        ('08/07/2008', 'nascimento'),
        ('10900092', 'rg'),
        ('SDS-PE', 'rg_orgao'),
        ('138.891.704-12', 'cpf'),
        ('31 de dezembro de 2025', 'conclusao_data'),
        ('Ensino Médio Integral, Integrado à Educação Profissional', 'conclusao_texto'),
        ('Ambiente e Saúde', 'eixo'),
    ]:
        sub(root, body, old, '{{%s}}' % key)

    # Assinaturas (frente e verso).
    for _ in (0, 1):
        whole(root, 'Doriane Cristina Clemente Batista', 'sec_nome')
        whole(root, 'José Roberto Lima Miranda', 'dir_nome')
        whole(root, 'Diretor', 'dir_cargo')
        whole(root, 'Secretária', 'sec_cargo')
    sub(root, 'Portaria SEE/SEGP nº 7580 de 09/09/2025 - ', 'Portaria SEE/SEGP nº 7580 de 09/09/2025', '{{sec_ato}}')
    sub(root, '{{sec_ato}} - ', 'D.O. de 10/09/2025', '{{sec_do}}')
    sub(root, 'ATO nº 5343 de 09/07/2024 ', 'ATO nº 5343 de 09/07/2024', '{{dir_ato}}')
    sub(root, '{{dir_ato}} ', 'D.O. de 10/07/2024', '{{dir_do}}')
    whole(root, 'Portaria SEE/SEGP nº 7580 de 09/09/2025', 'sec_ato')
    whole(root, 'ATO nº 5343 de 09/07/2024', 'dir_ato')
    sub(root, 'Publicada no', 'D.O. de 10/09/2025', '{{sec_do}}')
    sub(root, 'Publicado no', 'D.O. de 10/07/2024', '{{dir_do}}')
    sub(root, '85021701', '85021701', '{{sec_matricula}}')
    sub(root, '115962301', '115962301', '{{dir_matricula}}')

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
    make_perfil(root)

    out = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    left = re.findall(rb'ADNA|ESDRAS|49279|Doriane|Farm\xc3\xa1cia', out)
    if left:
        raise SystemExit('Sobrou texto de exemplo: %r' % set(left))
    return out


def main(src, dst):
    zin = zipfile.ZipFile(src)
    zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename.startswith('word/embeddings/'):
            continue
        if item.filename == 'word/document.xml':
            data = transform(data)
        elif item.filename == 'word/_rels/document.xml.rels':
            data = re.sub(rb'<Relationship [^>]*oleObject[^>]*/>', b'', data)
        elif item.filename == '[Content_Types].xml':
            data = re.sub(rb'<Default Extension="bin"[^>]*/>', b'', data)
        zout.writestr(item, data)
    zout.close()


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
