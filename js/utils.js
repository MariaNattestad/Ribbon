import Papa from "papaparse";

export function download(filename, textOrBlob) {
    const blob = textOrBlob instanceof Blob ? textOrBlob : new Blob([textOrBlob]);
    const url = URL.createObjectURL(blob);
    download_url(filename, url);
}

export function download_url(filename, url) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
}

export async function exportViz({ format, element, filename } = {format: "svg"}) {
    const serializer = new XMLSerializer();
    const svg = serializer.serializeToString(element);

    if(format === "svg") {
        const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        download_url(filename, url);
    } else if(format === "png") {
        // Generate object URL with a blob: don't rely on canvas.toDataURL(), which can cause performance issues for large images
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

        // Create new Image object
        const img = new Image();
        img.src = svgDataUrl;
        await new Promise((resolve) => (img.onload = resolve));

        // Create canvas with same size as SVG
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        const blob = await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
        download(filename, blob);
    } else {
        throw new Error("Format not supported:", format);
    }
}

// Enable using await on papaParse so don't need annoying callbacks.
// Based on <https://github.com/mholt/PapaParse/issues/752#issuecomment-567294386>
export async function papaParse(file, options) {
	return new Promise((resolve, reject) => {
		Papa.parse(file, {
			...options,
			complete: (results) => resolve(results),
			error: (error) => reject(error)
		});
	});
}
