import { useEffect, useState } from "preact/hooks";

export const Devices = (
  { tracks, devices, setDevices }: {
    tracks: boolean;
    devices: any[];
    setDevices: (devices: any[]) => void;
  },
) => {
  const [devicesLoaded, setDevicesLoaded] = useState(false);

  if (!tracks) {
    return null;
  }

  const getDevices = async () => {
    const response = await fetch(`/api/spotify/devices`);
    setDevices(JSON.parse(await response.text()));
    setDevicesLoaded(true);
  };

  useEffect(() => {
    getDevices();
  }, []);

  return !devicesLoaded || devices?.length === 0
    ? (
      <div>
        No devices found. You must have spotify open to play. Open spotify and
        {" "}
        <a
          className="cursor-pointer underline"
          onClick={() => getDevices()}
        >
          refresh device list
        </a>.
      </div>
    )
    : (
      <div className="flex flex-row justify-start items-center">
        <span className="hidden md:inline">Devices:</span>
        <select
          name="device"
          id="device"
          className="border-gray-200 rounded mx-3 w-full p-1"
        >
          {devices.map(({ id, name }: any) => (
            <option className="px-2 mx-2" value={id}>{name}</option>
          ))}
        </select>
      </div>
    );
};
