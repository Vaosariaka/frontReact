import axios from "axios";
import { XMLBuilder, XMLParser } from "fast-xml-parser";


const apiKey = import.meta.env.VITE_PS_API_KEY;

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const buildAuthHeaders = (contentType = "application/xml") => ({
  Authorization: `Basic ${btoa(apiKey + ":")}`,
  "Content-Type": contentType,
});

export const fetchProductImages= async (productId) => {
    const res = await axios.get(
      `/api/api/images/products/${productId}`,
      {
        headers: buildAuthHeaders(),
        responseType: "text",
      }
    );
  
    const payload = parser.parse(res.data);
    const images = payload?.prestashop?.images?.image;
    if (!images) return [];
    return Array.isArray(images) ? images : [images];
  };

export const createProductImage = async (productId, imageData) => {
    const xml = builder.build({
      image: {
        id_product: productId,
        position: imageData.position,
        cover: imageData.cover ? 1 : 0,
      },
    });
  
    const res = await axios.post(
      `/api/api/images/products/${productId}`,
      xml,
      {
        headers: buildAuthHeaders(),
        responseType: "text",
      }
    );
  
    const payload = parser.parse(res.data);
    return payload?.prestashop?.image || null;
  };

export const uploadProductImageFile = async (imageId, file) => {
    const formData = new FormData();
    formData.append("file", file);
  
    await axios.post(
      `/api/api/images/${imageId}/file`,
      formData,
      {
        headers: {
          Authorization: `Basic ${btoa(apiKey + ":")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
  };

const parseReferenceFromName = (fileName) => {
  const base = String(fileName || "").split("/").pop() || "";
  const noExt = base.replace(/\.[^.]+$/, "");
  // Ex: T_01.png, P_01-1.jpg, M_02_cover.jpeg -> T_01 / P_01 / M_02
  const match = noExt.match(/^([A-Za-z0-9]+_[0-9]+)(?:[_-].*)?$/);
  return match ? match[1] : null;
};

const fetchProductIdByReference = async (reference) => {
  const res = await axios.get(
    `/api/api/products?display=full&filter[reference]=${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    }
  );

  const payload = parser.parse(res.data);
  const product = payload?.prestashop?.products?.product;
  if (!product) return null;
  const first = Array.isArray(product) ? product[0] : product;
  return first?.id || null;
};

export const importImageFromZipEntry = async ({ name, file }) => {
  const reference = parseReferenceFromName(name);
  if (!reference) {
    throw new Error(
      `Nom image invalide (${name}). Format attendu: REFERENCE.ext (ex: T_01.png).`
    );
  }

  const productId = await fetchProductIdByReference(reference);
  if (!productId) {
    throw new Error(`Produit introuvable pour la reference image: ${reference}`);
  }

  const formData = new FormData();
  formData.append("image", file, name);

  await axios.post(`/api/api/images/products/${productId}`, formData, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
