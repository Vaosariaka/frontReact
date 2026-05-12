import axios from "axios";
import { XMLBuilder } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

export const createEmployee = ({ date,nom, email,pwd,adresse,achat,etat}) => {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const splitName = (nom) => {
    const value = String(nom || "").trim();
    if (!value) return { firstname: "", lastname: "" };
    const parts = value.split(/\s+/);
    if (parts.length === 1) return { firstname: parts[0], lastname: parts[0] };
    return {
      firstname: parts[0],
      lastname: parts.slice(1).join(" "),
    };
  };

  const { firstname, lastname } = splitName(nom);
  const active = String(etat ?? "1");

  const obj = {
    prestashop: {
      employee: {
        firstname,
        lastname,
        email,
        passwd: pwd,
        active,
      },
    },
  };

  const xml = builder.build(obj);

  return axios.post("/api/api/employees", xml, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      "Content-Type": "application/xml",
    },
  });
};