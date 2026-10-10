import "./globals.css";
export const metadata = { title: "Aangan leads" };
export default function Layout({ children }) {
  return (
    <html lang="en"><body>
      <header><b>Aangan leads</b><nav><a href="/">Owner overview</a><a href="/leads">Leads</a><a href="/leads?view=recovery">Recovery queue</a></nav></header>
      <main>{children}</main>
    </body></html>
  );
}
