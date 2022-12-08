//font optimization from @next/font
import { Inter } from "@next/font/google";
import { Kanit } from "@next/font/google";
import { Roboto_Mono } from "@next/font/google";

export const inter = Inter({
  subsets: [
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "greek-ext",
    "latin",
    "latin-ext",
    "vietnamese",
  ],
  variable: "--font-inter",
});

export const kanit = Kanit({
  subsets: ["latin", "latin-ext", "thai", "vietnamese"],
  weight: "700",
  variable: "--font-kanit",
});

export const roboto_mono = Roboto_Mono({
  subsets: [
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "latin",
    "latin-ext",
    "vietnamese",
  ],
  weight: ["400", "700"],
  variable: "--font-roboto-mono",
});
