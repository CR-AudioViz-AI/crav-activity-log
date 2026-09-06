// app/layout.tsx — server-rendered brand shell
// CR AudioViz AI · EIN: 39-3646201 · May 2026
import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  // 2026-09-04: added after Javari Verify found no canonical on this origin.
  // Without one, the same page at the apex, at www, with a trailing slash and
  // with tracking parameters is treated as four competing pages and the ranking
  // is split between them.
  metadataBase: new URL('https://javariactivity.com'),
  // './' resolves per page rather than pinning every route to the homepage,
  // which is the defect found on craudiovizai.com where /apps, /contact and
  // /features all declared themselves duplicates of the home page.
  alternates: { canonical: './' },
  title: 'Javari Activity Log',
  description: 'Platform activity monitoring and audit trail system.',
  openGraph: { title: 'Javari Activity Log', description: 'Platform activity monitoring and audit trail system.', type: 'website' },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {/* 2026-09-10: WCAG 2.4.1. Without this a keyboard user traverses the
            entire navigation on every page before reaching anything. Visually
            hidden until focused, which is the point - it is for people who are
            not using a mouse, and it appears the moment they tab. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:outline focus:outline-2"
        >
          Skip to main content
        </a>

        <div style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 200 }}>
          <a href="https://craudiovizai.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 600 }}>
            <span>📋</span>
            <span style={{ color: '#374151' }}>Javari Activity Log</span>
            <span style={{ color: '#374151', fontSize: 11, marginLeft: 4 }}>· CR AudioViz AI · EIN 39-3646201</span>
          </a>
          <a href="https://craudiovizai.com/auth/signup" style={{ background: '#374151', color: '#000', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Admin →
          </a>
        </div>
        {children}
        <footer style={{ background: '#050608', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 24px', textAlign: 'center' }}>
          <p style={{ color: '#1f2937', fontSize: 11, margin: 0, fontFamily: 'system-ui' }}>
            © 2026 CR AudioViz AI, LLC — EIN: 39-3646201 · Fort Myers, Florida · Your Story. Our Design. ·{' '}
            <a href="https://craudiovizai.com" style={{ color: '#374151', textDecoration: 'none' }}>craudiovizai.com</a>
            {' '}·{' '}
            <a href="https://craudiovizai.com/auth/signup" style={{ color: '#374151', textDecoration: 'none', fontWeight: 600 }}>Sign Up Free</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
