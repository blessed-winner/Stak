import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isUUID(val: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function formatDate(date: Date | any) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(date: string | Date | any) {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 0) return 'Just now';
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
}

export type VideoProvider = 'youtube' | 'vimeo' | 'external';

export function getProvider(url: string | null | undefined): VideoProvider {
  if (!url) return 'external';
  
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) return 'youtube';
    if (parsed.hostname.includes('vimeo.com')) return 'vimeo';
  } catch {
    // Fallback regex check if URL parsing fails
    if (url.match(/(?:youtube\.com|youtu\.be)/)) return 'youtube';
    if (url.match(/vimeo\.com/)) return 'vimeo';
  }
  
  return 'external';
}

export function getEmbedUrl(url: string) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);

    // YouTube
    if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
      const videoId =
        parsedUrl.hostname.includes('youtu.be')
          ? parsedUrl.pathname.replace('/', '')
          : parsedUrl.pathname.includes('/shorts/')
            ? parsedUrl.pathname.split('/shorts/')[1]?.split('/')[0]
            : parsedUrl.searchParams.get('v') || parsedUrl.pathname.split('/embed/')[1]?.split('/')[0];

      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (parsedUrl.hostname.includes('vimeo.com')) {
      const vimeoId = parsedUrl.pathname.split('/').filter(Boolean).pop();
      if (vimeoId && /^\d+$/.test(vimeoId)) {
        return `https://player.vimeo.com/video/${vimeoId}`;
      }
    }
  } catch {
    // Fall back to regex parsing for malformed input.
  }

  // YouTube fallback
  const ytMatch = url.match(/(?:youtube\.com\/watch.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo fallback
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

export function getVideoThumbnail(url: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1593005517304-198371660042?auto=format&fit=crop&q=80&w=800';

  // YouTube
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;

  // Vimeo
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    // Note: Vimeo ideally needs an API call for the real thumb, but we can't do that easily client-side without a token.
    // We'll use a high-quality placeholder for now.
    return 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800';
  }

  return 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800';
}

export async function getVideoDuration(url: string): Promise<string> {
  if (!url) return '--:--';
  
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return '--:--';
    } else if (url.includes('vimeo.com')) {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
      const res = await fetch(oembedUrl);
      const data = await res.json();
      if (data.duration) {
        const mins = Math.floor(data.duration / 60);
        const secs = data.duration % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    } else {
      // For external links, we can't reliably get duration without loading the whole thing (if it's a direct file)
      // or we can't get it at all if it's a preview page (Loom, Drive).
      // We'll return '--:--' and let the user see it on the destination page.
      return '--:--';
    }
  } catch (e) {
    console.error('Error fetching duration:', e);
  }
  
  return '--:--';
}

function formatPlaybackSeconds(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
