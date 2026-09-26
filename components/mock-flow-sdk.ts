/**
 * Browser-native & mobile fallback for flow-sdk to allow running the app locally and on Android.
 * Offers standard file picker for media selection and local file downloading/sharing for export.
 */
export const Flow = {
  media: {
    select: async (): Promise<{ type: 'video' | 'image'; base64: string; mimeType: string } | null> => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const commaIdx = dataUrl.indexOf(',');
            const base64 = dataUrl.substring(commaIdx + 1);
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            resolve({
              type,
              base64,
              mimeType: file.type,
            });
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }
  },
  save: async (params: { base64: string; mimeType: string; name: string }): Promise<any> => {
    try {
      const byteCharacters = atob(params.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: params.mimeType });
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = params.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.warn("Local save failed", err);
    }
    return { success: true, localSaved: true };
  }
};
