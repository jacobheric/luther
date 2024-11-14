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

  if (!tracks) {
    return null;
  }

  const getDevices = async () => {
    setLoading(true);
    const response = await fetch(`/api/spotify/devices`);
    setDevices(JSON.parse(await response.text()));
    setDevicesLoaded(true);
    setTimeout(() => setLoading(false), 1000);
  };

  useEffect(() => {
    getDevices();
  }, []);

  return (
    <div className="flex flex-row justify-start items-center gap-2">
      <span className="hidden md:inline">Devices:</span>
      {devices?.length > 0
        ? (
          <select
            name="device"
            id="device"
            disabled={!devicesLoaded || devices?.length === 0}
            className="p-0 text-right"
          >
            {devices.map(({ id, name }: Device) => (
              <option className="px-2 mx-2" value={id || ""}>{name}</option>
            ))}
          </select>
        )
        : <div>None Found</div>}
      <Tooltip tooltip="Reload devices" className="top-6">
        <Reload
          className={`cursor-pointer w-5 h-5 ${loading && "animate-spin"}`}
          onClick={getDevices}
        />
      </Tooltip>
      <Tooltip
        tooltip="Spotify must be open to be found."
        className="top-6 "
      >
        <InfoCircle className="w-5 h-5" />
      </Tooltip>
    </div>
  );
};
