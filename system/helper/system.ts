// Developed by Hirnyk Vlad (HERN1k)

import { execSync } from "node:child_process";
import { logger } from "../core/logger";
import type { IDiskInfo } from "../core/types";

export class System {
    /**
     * Gets information about free disk space (in GB).
     */
    public static getDiskSpace(): IDiskInfo {
        try {
            if (process.platform === 'win32') {
                const psCommand = "Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DeviceID -eq 'C:' } | Select-Object Size, FreeSpace";
                const output = execSync(`powershell -Command "${psCommand}"`).toString();
                const numbers = output.match(/\d+/g);
                
                if (numbers && numbers.length >= 2) {
                    const size = parseFloat(numbers[0]!);
                    const free = parseFloat(numbers[1]!);
                    return {
                        total: `${(size / 1024 ** 3).toFixed(2)} GB`,
                        free: `${(free / 1024 ** 3).toFixed(2)} GB`,
                        usedPercent: `${((1 - free / size) * 100).toFixed(0)}%`
                    };
                }
                throw new Error("Parse error");
            } else {
                const output = execSync("df -h / | tail -1").toString();
                const [, size, , available, percent] = output.trim().split(/\s+/);
                return { total: size!, free: available!, usedPercent: percent! };
            }
        } catch (e: any) {
            logger.error(`Disk Info Error: ${e.message}`, "SYS_HELPER");
            return { total: "unknown", free: "unknown", usedPercent: "0%" };
        }
    }
}