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