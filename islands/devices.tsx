import { type Device } from "@spotify/web-api-ts-sdk";
import Reload from "tabler-icons/tsx/reload.tsx";
import InfoCircle from "tabler-icons/tsx/info-circle.tsx";
import Tooltip from "@/islands/tooltip.tsx";

export const Devices = (
  {
    tracks,
    devices,
    loading,
    devicesLoaded,
    onRefresh,
    selectedDeviceId,
    onSelectDevice,
  }: {
    tracks: boolean;
    devices: Device[];
    loading: boolean;
    devicesLoaded: boolean;
    onRefresh: () => Promise<unknown>;
    selectedDeviceId: string;
    onSelectDevice: (deviceId: string) => void;
  },
) => {
  if (!tracks) {
    return null;
  }

  return (
    <div className="flex flex-row items-center gap-1.5">
      <select
        name="device"
        id="device"
        value={selectedDeviceId}
        disabled={!devicesLoaded || loading || devices?.length === 0}
        className="flex-1 p-2 text-sm !border-0"
        onChange={(event) =>
          onSelectDevice((event.target as HTMLSelectElement).value)}
      >
        {!devicesLoaded && <option value="">Loading devices...</option>}
        {devicesLoaded && devices?.length === 0 &&
          <option value="">No device found</option>}
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
          onClick={() => void onRefresh()}
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
