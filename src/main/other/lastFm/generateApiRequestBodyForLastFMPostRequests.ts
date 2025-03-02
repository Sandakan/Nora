import hashText from '../../utils/hashText';
import {
  AuthData,
  LoveParams,
  ScrobbleParams,
  updateNowPlayingParams
} from '../../../types/last_fm_api';

type LastFMApi = (
  | { method: 'track.scrobble'; params: ScrobbleParams }
  | { method: 'track.updateNowPlaying'; params: updateNowPlayingParams }
  | {
      method: 'track.love' | 'track.unlove';
      params: LoveParams;
    }
) & { authData: AuthData };

const generateApiSignatureForLastFmPostRequests = (data: LastFMApi) => {
  const { authData, method, params } = data;
  const { LAST_FM_API_KEY, LAST_FM_SHARED_SECRET, SESSION_KEY } = authData;

  const sigComponents: [string, string | number][] = [
    ['method', method],
    ['api_key', LAST_FM_API_KEY],
    ['sk', SESSION_KEY]
  ];

  for (const [prop, value] of Object.entries(params)) {
    if (value !== undefined) sigComponents.push([prop, value]);
  }

  //   Signature parameters should be sorted alphabetically
  sigComponents.sort((a, b) => (a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0));
  //   Lastly, the SHARED_SECRET should be appended to the end of the signature.
  const jointSigComponents = sigComponents.map((components) => components.join(''));
  jointSigComponents.push(LAST_FM_SHARED_SECRET);

  const sig = jointSigComponents.join('');
  const hashedSig = hashText(sig);
  return hashedSig;
};

export const generateApiRequestBodyForLastFMPostRequests = (data: LastFMApi) => {
  const { authData, method, params } = data;
  const { LAST_FM_API_KEY, SESSION_KEY } = authData;

  const API_SIGNATURE = generateApiSignatureForLastFmPostRequests(data);

  const bodyComponents: [string, string | number][] = [
    ['method', method],
    ['api_key', LAST_FM_API_KEY],
    ['sk', SESSION_KEY],
    ['api_sig', API_SIGNATURE]
  ];

  for (const [prop, value] of Object.entries(params)) {
    if (value !== undefined) bodyComponents.push([prop, encodeURIComponent(value)]);
  }

  const jointBodyComponents = bodyComponents.map((bodyComponent) => bodyComponent.join('='));
  const body = jointBodyComponents.join('&');
  return body;
};

export default generateApiRequestBodyForLastFMPostRequests;
