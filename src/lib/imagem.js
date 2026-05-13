// imagem.js — utilitário para preparar a foto de perfil.
// Redimensiona/recorta (quadrado, centralizado) e comprime para um data URL pequeno,
// já que a foto é guardada dentro do documento do Firestore (limite ~1 MB por doc).

export function lerFotoPerfil(file, { tamanho = 256, qualidade = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Selecione um arquivo de imagem."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = tamanho;
        canvas.height = tamanho;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamanho, tamanho);
        const dataUrl = canvas.toDataURL("image/jpeg", qualidade);
        URL.revokeObjectURL(url);
        // Margem de segurança: data URL não deve passar de ~700 KB.
        if (dataUrl.length > 700_000) {
          reject(new Error("Imagem muito grande, tente outra."));
          return;
        }
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}
