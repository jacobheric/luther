import { useEffect, useState } from "preact/hooks";
import { type Device } from "@spotify/web-api-ts-sdk";
import Reload from "tabler-icons/tsx/reload.tsx";
import InfoCircle from "tabler-icons/tsx/info-circle.tsx";
import Tooltip from "@/islands/tooltip.tsx";

export const Devices = (
  { tracks, devices, setDevices }: {
    tracks: boolean;
    devices: Device[];
    setDevices: (devices: Device[]) => void;
  },
) => {
  const [devicesLoaded, setDevicesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDevices = async () => {
    const response = await fetch(`/api/spotify/devices`);
    setDevices(JSON.parse(await response.text()));
    setDevicesLoaded(true);
    setTimeout(() => setLoading(false), 1000);
  };

  useEffect(() => {
    if (tracks) {
      getDevices();
    }
  }, [tracks]);

  if (!tracks) {
    return null;
  }

  return (
    <div className="flex flex-row justify-between md:justify-start items-center w-full">
      <div className="flex flex-row justify-start gap-2 items-center border border-r-0 rounded p-3 rounded-r-none text-gray-900 dark:text-white">
        <Tooltip
          tooltip="Reload devices"
          className="top-6 left-2"
        >
          <Reload
            className={`cursor-pointer w-5 ${loading && "animate-spin"}`}
            onClick={() => {
              setLoading(true);
              getDevices();
            }}
          />
        </Tooltip>

        <Tooltip
          tooltip="Spotify must be open to be found"
          className="top-6 left-2"
          tooltipClassName={`${
            devicesLoaded && devices?.length === 0 ? "block" : "hidden"
          }`}
        >
          <InfoCircle className="w-5" />
        </Tooltip>
      </div>

      <select
        name="device"
        id="device"
        disabled={!devicesLoaded || devices?.length === 0}
        className="w-full rounded-l-none"
      >
        {devices?.length === 0 && <option value="">No Device Found</option>}
        {devices.map(({ id, name }: Device) => (
          <option className="px-2 mx-2" value={id || ""}>{name}</option>
        ))}
      </select>
    </div>
  );
};
