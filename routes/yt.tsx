import { encodeHex } from "jsr:@std/encoding/hex";

const hash = async (s: string) => {
  const messageBuffer = new TextEncoder().encode(s);
  const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);

  return encodeHex(hashBuffer);
};

const getAuth = async () => {
  const now = new Date();
  const origin = "https://music.youtube.com";
  const timems = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const timesec = Math.round(timems / 1000);
  const SAPISID = "UKaY_9hzCR3VcCT4/AgYJ_yLaHEUSXnhPt";
  const newHash = timesec + "_" +
    await hash(timesec + " " + SAPISID + " " + origin);
  return newHash;
};

const liked = async () =>
  fetch("https://music.youtube.com/youtubei/v1/browse?prettyPrint=true", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "authorization": await getAuth(),
      "content-type": "application/json",
      "priority": "u=1, i",
      "sec-ch-ua":
        '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      "sec-ch-ua-arch": '"arm"',
      "sec-ch-ua-bitness": '"64"',
      "sec-ch-ua-form-factors": '"Desktop"',
      "sec-ch-ua-full-version": '"126.0.6478.114"',
      "sec-ch-ua-full-version-list":
        '"Not/A)Brand";v="8.0.0.0", "Chromium";v="126.0.6478.114", "Google Chrome";v="126.0.6478.114"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"macOS"',
      "sec-ch-ua-platform-version": '"14.5.0"',
      "sec-ch-ua-wow64": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "same-origin",
      "sec-fetch-site": "same-origin",
      "x-client-data":
        "CIe2yQEIpbbJAQipncoBCIXhygEIk6HLAQj3mM0BCIagzQEIporOAQjok84BCOOXzgEI7ZvOAQjFnc4BCKyezgEIs5/OAQihos4BCKeizgEY1uvNARignc4BGOuNpRc=",
      "x-goog-authuser": "0",
      "x-goog-visitor-id": "Cgs2UDVCdWVRdk05WSi3p-CzBjIKCgJVUxIEGgAgIA%3D%3D",
      "x-origin": "https://music.youtube.com",
      "x-youtube-bootstrap-logged-in": "true",
      "x-youtube-client-name": "67",
      "x-youtube-client-version": "1.20240617.01.00",
    },
    "body":
      '{"context":{"client":{"hl":"en","gl":"US","remoteHost":"71.161.220.25","deviceMake":"Apple","deviceModel":"","visitorData":"Cgs2UDVCdWVRdk05WSi3p-CzBjIKCgJVUxIEGgAgIA%3D%3D","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36,gzip(gfe)","clientName":"WEB_REMIX","clientVersion":"1.20240617.01.00","osName":"Macintosh","osVersion":"10_15_7","originalUrl":"https://music.youtube.com/","platform":"DESKTOP","clientFormFactor":"UNKNOWN_FORM_FACTOR","configInfo":{"appInstallData":"CLen4LMGEKKBsAUQsO6wBRDMirEFEJCysAUQlImxBRD3sf8SEKKSsAUQiIewBRCCov8SEMnmsAUQt--vBRCX8bAFEOOt_xIQ-6v_EhDqw68FEParsAUQx4SxBRDb_7AFEOX0sAUQ_IWwBRCs-7AFEIO_sAUQvZmwBRCWn_8SEI3asAUQx_-wBRDd6P4SENnJrwUQ_bj9EhC9tq4FEMn3rwUQzu6wBRDViLAFEMeKsQUQpO2wBRD0q7AFELersAUQ2N2wBRC36v4SEJ3QsAUQ0PqwBRC1sf8SEOuTrgUQx_2wBRC9irAFEOqJsQUQxIyxBRDPqLAFEIjjrwUQ24qxBRComrAFEOK4sAUQ6-j-EhDvzbAFENPhrwUQ0I2wBRDG_7AFEJeDsQUQmYexBRCU_rAFENbdsAUQk--wBRDj0bAFENWLsQUQ-vCwBRC-gLEFEKrYsAUQ2uWwBRClwv4SEMzfrgUQmvCvBRCj-LAFEMr5sAUQlpWwBRD_g_8SKiBDQU1TRWhVSnBiMndETnprQm9PejlBdm1wZ0lkQnc9PQ%3D%3D","coldConfigData":"CLen4LMGGjJBT2pGb3gzcXJOYmdxeXJ0a3AzRFM0QktlOVlncjdUb0pieWlwSUo4TE10ejVEZXVmUSIyQU9qRm94MkZqemZjaEo2MHNwUmFhUzZMdFVsWWg0bld5RlNDd1R6YjF0T1VHaU9YZVE%3D","coldHashData":"CLen4LMGEhI4NDQ4NzA4MTY2NDU0NDcwNzYYt6fgswYyMkFPakZveDNxck5iZ3F5cnRrcDNEUzRCS2U5WWdyN1RvSmJ5aXBJSjhMTXR6NURldWZROjJBT2pGb3gyRmp6ZmNoSjYwc3BSYWFTNkx0VWxZaDRuV3lGU0N3VHpiMXRPVUdpT1hlUQ%3D%3D","hotHashData":"CLen4LMGEhM3MTk2MTQwODE2MDk3ODA1MjkzGLen4LMGMjJBT2pGb3gzcXJOYmdxeXJ0a3AzRFM0QktlOVlncjdUb0pieWlwSUo4TE10ejVEZXVmUToyQU9qRm94MkZqemZjaEo2MHNwUmFhUzZMdFVsWWg0bld5RlNDd1R6YjF0T1VHaU9YZVE%3D"},"browserName":"Chrome","browserVersion":"126.0.0.0","acceptHeader":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7","deviceExperimentId":"ChxOek00TXpZM016STJOakF4TWpBeE1qTTVOZz09ELen4LMGGLen4LMG","screenWidthPoints":847,"screenHeightPoints":992,"screenPixelDensity":2,"screenDensityFloat":2,"utcOffsetMinutes":-240,"userInterfaceTheme":"USER_INTERFACE_THEME_LIGHT","timeZone":"America/New_York","musicAppInfo":{"pwaInstallabilityStatus":"PWA_INSTALLABILITY_STATUS_CAN_BE_INSTALLED","webDisplayMode":"WEB_DISPLAY_MODE_BROWSER","storeDigitalGoodsApiSupportStatus":{"playStoreDigitalGoodsApiSupportStatus":"DIGITAL_GOODS_API_SUPPORT_STATUS_UNSUPPORTED"}}},"user":{"lockedSafetyMode":false},"request":{"useSsl":true,"internalExperimentFlags":[],"consistencyTokenJars":[]},"clickTracking":{"clickTrackingParams":"CLECEKCzAhgAIhMI5OSvxN7xhgMV84DkBh2CKQE3"},"adSignalsInfo":{"params":[{"key":"dt","value":"1719145399935"},{"key":"flash","value":"0"},{"key":"frm","value":"0"},{"key":"u_tz","value":"-240"},{"key":"u_his","value":"5"},{"key":"u_h","value":"1117"},{"key":"u_w","value":"1728"},{"key":"u_ah","value":"1079"},{"key":"u_aw","value":"1728"},{"key":"u_cd","value":"30"},{"key":"bc","value":"31"},{"key":"bih","value":"992"},{"key":"biw","value":"847"},{"key":"brdim","value":"0,38,0,38,1728,38,1728,1079,847,992"},{"key":"vis","value":"1"},{"key":"wgl","value":"true"},{"key":"ca_type","value":"image"}]}},"browseId":"VLLM"}',
    "method": "POST",
    "mode": "cors",
    "credentials": "include",
  });

export default async function YouTubeMusic() {
  const tracks = await liked();
  const json = await tracks.json();
  console.log("shit liked", json);
  return <div>...coming soon...</div>;
}
