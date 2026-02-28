import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trustra",
  description:
    "Trustra is a real time trust scoring engine that evaluates the reliability of users in digital payment systems using behavioral signals, transaction history, and feedback patterns."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="strip-extension-attrs" strategy="beforeInteractive">
          {`
            (function () {
              var shouldRemove = function (name) {
                return name === "bis_skin_checked" ||
                  name === "bis_register" ||
                  name.indexOf("__processed_") === 0;
              };
              var cleanNode = function (node) {
                if (!node || !node.getAttributeNames) return;
                var attrs = node.getAttributeNames();
                for (var i = 0; i < attrs.length; i++) {
                  if (shouldRemove(attrs[i])) node.removeAttribute(attrs[i]);
                }
              };
              cleanNode(document.documentElement);
              cleanNode(document.body);
              var nodes = document.querySelectorAll("*");
              for (var i = 0; i < nodes.length; i++) cleanNode(nodes[i]);
              var observer = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                  var m = mutations[i];
                  if (m.type === "attributes" && shouldRemove(m.attributeName || "")) {
                    m.target.removeAttribute(m.attributeName);
                  }
                }
              });
              observer.observe(document.documentElement, {
                attributes: true,
                subtree: true
              });
            })();
          `}
        </Script>
      </head>
      <body
        className="bg-gray-50 text-gray-900 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
