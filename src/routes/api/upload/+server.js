// src/routes/api/upload/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

/**
 * POST - Subir archivo a Supabase Storage
 * Body: { file: string (base64), fileName: string, bucket: string }
 */
export async function POST({ request }) {
  try {
    const { file, fileName, bucket = 'comprobantes' } = await request.json();
    
    if (!file || !fileName) {
      return json(
        { success: false, error: 'Archivo y nombre son requeridos' },
        { status: 400 }
      );
    }
    
    // Convertir base64 a Buffer
    const fileBuffer = Buffer.from(file, 'base64');
    
    // Determinar content type
    let contentType = 'image/jpeg';
    if (fileName.endsWith('.png')) contentType = 'image/png';
    else if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) contentType = 'image/jpeg';
    
    // Subir a Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false
      });
    
    if (error) {
      console.error('Error en Supabase Storage:', error);
      throw new Error(error.message);
    }
    
    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return json({
      success: true,
      url: urlData.publicUrl,
      path: data.path
    });
    
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}