function getInstagramEmbedUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  const match = trimmed.match(/(?:instagram\.com|instagr\.am)\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.instagram.com/reel/${match[1]}/embed/`;
  }
  return null;
}

console.log('Result for DaS9nyUMUEg:', getInstagramEmbedUrl('https://www.instagram.com/reel/DaS9nyUMUEg/'));
console.log('Result for empty string:', getInstagramEmbedUrl(''));
console.log('Result for undefined:', getInstagramEmbedUrl(undefined));
