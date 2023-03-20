import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  environment,
  endpointOptions,
  endpointsStaging,
  endpointsProduction,
} from "lib/constants";

export type EndpointSettingsState = {
  "endpoint-production": string;
  "endpoint-staging": string;
};

const findAlternativeEndpoint = (endpoint: string): string | undefined => {
  const alternativeEndpoint = endpointOptions.find(
    (option) => option.environment === environment && option.value != endpoint,
  );

  return alternativeEndpoint?.value;
};

const endpointSettingsAtom = atomWithStorage<EndpointSettingsState>(
  "endpointSettings",
  {
    "endpoint-staging": endpointsStaging[0].value,
    "endpoint-production": endpointsProduction[0].value,
  },
);

export const useEndpointSettings = () => {
  const [endpointSettings, setEndpointSettings] = useAtom(endpointSettingsAtom);

  const endpoint = endpointSettings[`endpoint-${environment}`];

  const setEndpoint = (endpoint: string) => {
    setEndpointSettings({
      ...endpointSettings,
      [`endpoint-${environment}`]: endpoint,
    });
  };

  const getNextBestEndpoint = () => {
    const alternativeEndpoint = findAlternativeEndpoint(endpoint);
    return alternativeEndpoint;
  };

  return { endpoint, setEndpoint, getNextBestEndpoint } as const;
};

export default endpointSettingsAtom;
