/**
 * Contact Service (CC-05)
 * Public marketing form. This is the one route that must NOT carry an
 * Authorization header, so it uses a bare axios call rather than apiClient
 * (whose request interceptor attaches the bearer token automatically).
 */

import axios from "axios";
import { endpoints } from "@/lib/api";
import { ContactRequest } from "@/lib/api/types";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const contactService = {
  submit: async (body: ContactRequest): Promise<{ message: string }> => {
    const { data } = await axios.post(
      `${baseURL}${endpoints.contact.submit}`,
      body,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      },
    );
    return data;
  },
};
