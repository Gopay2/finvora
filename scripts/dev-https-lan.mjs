import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

function isPrivateIPv4(address) {
  const octets = address.split(".").map(Number);

  return (
    octets.length === 4 &&
    octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255) &&
    (octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168))
  );
}

function addressScore(address) {
  if (address.startsWith("192.168.")) return 3;
  if (address.startsWith("10.")) return 2;
  if (isPrivateIPv4(address)) return 1;
  return 0;
}

function findLanIPv4() {
  const configuredAddress = process.env.SCANNER_LAN_IP?.trim();

  if (configuredAddress) {
    if (!isPrivateIPv4(configuredAddress)) {
      throw new Error("SCANNER_LAN_IP debe ser una dirección IPv4 privada válida.");
    }

    return configuredAddress;
  }

  const addresses = Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal && isPrivateIPv4(entry.address))
    .map((entry) => entry.address)
    .sort((left, right) => addressScore(right) - addressScore(left));

  if (!addresses[0]) {
    throw new Error(
      "No se encontró una IPv4 privada. Conectá la PC a la misma red que el celular o definí SCANNER_LAN_IP.",
    );
  }

  return addresses[0];
}

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = path.join(projectDirectory, "node_modules", "next", "dist", "bin", "next");

try {
  const lanAddress = findLanIPv4();
  const commandArguments = [nextCli, "dev", "--hostname", lanAddress, "--experimental-https"];

  console.log(`IP de la red detectada: ${lanAddress}`);
  console.log(`Abrí https://${lanAddress}:3000 en el iPhone / Android cuando Next esté listo.`);
  console.log("La primera ejecución puede pedir permiso para instalar la CA local en Windows.");

  if (process.argv.includes("--print")) {
    process.exit(0);
  }

  const nextProcess = spawn(process.execPath, commandArguments, {
    cwd: projectDirectory,
    env: process.env,
    stdio: "inherit",
  });

  nextProcess.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exitCode = code ?? 1;
  });

  nextProcess.on("error", (error) => {
    console.error(`No se pudo iniciar Next: ${error.message}`);
    process.exitCode = 1;
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
