import axios from "axios";

const api = axios.create({
    baseURL:import.meta.env.VITE_BACKEND_URL,
});

export interface Model{
    id:string
    prompt:string
    generated_code:string
    stl_url:string
    timestamp:string
}

export const generateModel= (prompt:string)=>
    api.post<{id:string; stl_url:string;message:string}>("/cad/generate",{
        prompt
    });

export const getModels=()=>api.get<Model[]>("/cad/");

export const getModelById=(id:string)=>api.get<Model>(`/cad/${id}`);

//PUT to /cad/{id}
export const updateModel = (id: string, prompt: string) => 
    api.put(`/cad/${id}`, { prompt });

export const deleteModel = (id:string) =>api.delete(`/cad/${id}`);
