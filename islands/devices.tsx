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
    if (!response.ok) {
      setDevices([]);
      setDevicesLoaded(true);
      setLoading(false);
      return;
    }

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
    <div className="flex flex-row items-center gap-1.5">
      <select
        name="device"
        id="device"
        disabled={!devicesLoaded || devices?.length === 0}
        className="flex-1 p-2 text-sm !border-0"
      >
        {devices?.length === 0 && <option value="">No device found</option>}
        {devices.map(({ id, name }: Device) => (
          <option key={id || name} className="px-2 mx-2" value={id || ""}>
            {name}
          </option>
        ))}
      </select>

      <Tooltip tooltip="Reload devices" className="top-8 right-0">
        <button
          type="button"
          className="cursor-pointer !p-0 h-7 w-7 inline-flex items-center justify-center !border-0 !bg-transparent !rounded-none text-gray-500 hover:text-gray-900 dark:hover:text-white"
          onClick={() => {
            setLoading(true);
            void getDevices();
          }}
        >
          <Reload
            className={`w-4 h-4 shrink-0 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </Tooltip>
      <Tooltip
        tooltip="Spotify must be open to be found"
        className="top-8 right-0"
        tooltipClassName={`${
          devicesLoaded && devices?.length === 0 ? "block" : "hidden"
        }`}
      >
        <InfoCircle className="w-4 h-4 shrink-0 opacity-60" />
      </Tooltip>
    </div>
  );
};
