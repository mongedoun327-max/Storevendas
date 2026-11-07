interface WebUsbEndpoint {
  direction: "in" | "out";
  endpointNumber: number;
}

interface WebUsbAlternate {
  endpoints: WebUsbEndpoint[];
}

interface WebUsbInterface {
  interfaceNumber: number;
  alternate: WebUsbAlternate;
}

interface WebUsbConfiguration {
  interfaces: WebUsbInterface[];
}

interface WebUsbDevice {
  configuration: WebUsbConfiguration | null;
  open(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: Uint8Array): Promise<unknown>;
  close(): Promise<void>;
}

interface WebUsbNavigator {
  usb: {
    requestDevice(options: { filters: Array<{ classCode: number }> }): Promise<WebUsbDevice>;
  };
}

export async function printViaWebUSB(data: Uint8Array): Promise<void> {
  if (typeof navigator === "undefined" || !("usb" in navigator)) {
    throw new Error("A WebUSB API não é suportada neste navegador.");
  }

  const usbNavigator = navigator as Navigator & WebUsbNavigator;
  let device: WebUsbDevice | undefined;
  let interfaceNumber: number | undefined;
  let interfaceClaimed = false;

  try {
    device = await usbNavigator.usb.requestDevice({
      filters: [{ classCode: 7 }],
    });

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    const printerInterface = device.configuration?.interfaces[0];
    if (!printerInterface) {
      throw new Error("Interface USB da impressora não encontrada.");
    }

    interfaceNumber = printerInterface.interfaceNumber;
    await device.claimInterface(interfaceNumber);
    interfaceClaimed = true;

    const endpoint = printerInterface.alternate.endpoints.find(
      (candidate) => candidate.direction === "out"
    );
    if (!endpoint) {
      throw new Error("Endpoint de saída USB não encontrado.");
    }

    await device.transferOut(endpoint.endpointNumber, data);
  } catch (error) {
    console.error("Erro na impressão via WebUSB:", error);
    throw error;
  } finally {
    if (device && interfaceClaimed && interfaceNumber !== undefined) {
      await device.releaseInterface(interfaceNumber);
    }
    if (device) {
      await device.close();
    }
  }
}
