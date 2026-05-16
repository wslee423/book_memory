/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 네이버 쇼핑 표지 이미지 (128개 표지)
      { protocol: 'https', hostname: 'shopping-phinf.pstatic.net' },
      { protocol: 'https', hostname: 'shop-phinf.pstatic.net' },
      // 교보문고, 알라딘, 11번가
      { protocol: 'https', hostname: 'contents.kyobobook.co.kr' },
      { protocol: 'https', hostname: 'image.aladin.co.kr' },
      { protocol: 'https', hostname: 'cdn.011st.com' },
      // Supabase Storage (책 페이지 이미지)
      { protocol: 'https', hostname: 'lubknrqpyyhtnbkoruhq.supabase.co' },
    ],
  },
}

export default nextConfig
