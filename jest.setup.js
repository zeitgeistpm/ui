process.env.NEXT_PUBLIC_VERCEL_ENV = "production";

import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });
