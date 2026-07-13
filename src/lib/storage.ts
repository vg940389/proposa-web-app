import { supabase } from './supabase'
import { generateId } from './utils'

export async function uploadProposalImage(
  file: File,
  userId: string
): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${userId}/${generateId()}.${ext}`

  const { error } = await supabase.storage
    .from('proposal-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage
    .from('proposal-images')
    .getPublicUrl(path)

  return data.publicUrl
}

export async function deleteProposalImage(url: string): Promise<void> {
  const bucketPath = url.split('/proposal-images/')[1]
  if (!bucketPath) return

  const { error } = await supabase.storage
    .from('proposal-images')
    .remove([bucketPath])

  if (error) throw error
}
