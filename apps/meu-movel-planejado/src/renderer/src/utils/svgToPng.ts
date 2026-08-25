/**
 * O SVG que está no DOM virado bytes de PNG.
 *
 * Quem rasteriza é o renderer, e não o main, porque o desenho é dele: o main
 * não tem DOM nem fonte, e mandar o plano para lá ser redesenhado criaria um
 * segundo desenho capaz de divergir do que está à vista. O main entra na etapa
 * seguinte — o diálogo de salvar e a gravação —, que é o que o renderer não
 * tem.
 *
 * O caminho é o do navegador: serializar o SVG, carregá-lo como imagem e
 * pintá-lo num canvas. A imagem carrega por `data:` URL de propósito. O
 * documento que ela abre é isolado — não alcança a fonte empacotada do app,
 * daí a pilha do sistema declarada no SVG —, e uma URL de dado é também o que
 * mantém o canvas limpo: um canvas contaminado recusaria a leitura dos bytes,
 * e a exportação falharia no fim, depois de o usuário já ter escolhido a pasta.
 */

/**
 * Quantos pixels de arquivo por unidade do SVG. O dobro é o que separa um
 * rótulo de peça legível de um borrão quando o ajudante amplia a imagem no
 * celular — e o desenho é traço sobre branco, que comprime bem.
 */
const RASTER_SCALE = 2;

/**
 * Teto de lado e de área do canvas do Chromium. Estourá-lo não dá erro: dá um
 * canvas em branco, e o usuário só descobriria abrindo o arquivo. Um plano de
 * dezenas de chapas chega lá pela altura, então a nitidez é que cede — imagem
 * um pouco mais grossa é melhor do que imagem nenhuma.
 */
const MAX_CANVAS_SIDE = 32767;
const MAX_CANVAS_AREA = 268_435_456;

function rasterScaleFor(width: number, height: number): number {
  const bySide = Math.min(MAX_CANVAS_SIDE / width, MAX_CANVAS_SIDE / height);
  const byArea = Math.sqrt(MAX_CANVAS_AREA / (width * height));
  return Math.min(RASTER_SCALE, bySide, byArea);
}

export async function svgToPngBytes(svg: SVGSVGElement): Promise<Uint8Array> {
  const width = svg.width.baseVal.value;
  const height = svg.height.baseVal.value;

  const source = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  await image.decode();

  const scale = rasterScaleFor(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível preparar a imagem do plano.');

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar a imagem do plano.');

  return new Uint8Array(await blob.arrayBuffer());
}
