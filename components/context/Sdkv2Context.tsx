import { Context, Sdk } from "@zeitgeistpm/sdk-next";
import ModalStore from "lib/stores/ModalStore";
import { createContext } from "react";
import { Observable } from "rxjs";

export const Sdkv2Context = createContext<Observable<Sdk<Context>>>(null);
