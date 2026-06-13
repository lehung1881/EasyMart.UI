type DataType = "string" | "boolean" | "number";
import { uuidv7 } from "uuidv7";

class CommonFunction {
    formatNumber(number: number, decimalPlaces: number = 0): string | null {
        if (isNaN(number)) return null;

        const formattedNumber = number.toFixed(decimalPlaces);
        const [integerPart, decimalPart] = formattedNumber.split(".");

        const formattedInteger = (integerPart ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const formattedDecimal = decimalPart ? "." + decimalPart : "";

        return formattedInteger + formattedDecimal;
    }

    /**
     * Tạo Guid v4
     * @returns
     */
    generateGUIDV4(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Tạo Guid v7
     * @returns
     */
    generateGUIDV7(): string {
        return uuidv7();
    }

    /**
     * genShortID — Tạo chuỗi ngẫu nhiên 6 ký tự [a-z0-9].
     * Dùng counter + timestamp để đảm bảo không trùng giữa các lần gọi.
     */
    genShortID(): string {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let n = Date.now() + Math.floor(Math.random() * 1000000);
        let result = "";

        for (let i = 0; i < 6; i++) {
            result += chars[n % chars.length];
            n = Math.floor(n / chars.length);
        }

        return result;
    }

    getTokenExpired(): string | null {
        return localStorage.getItem("tokenExpried");
    }

    setTokenExpired(expiredToken: string): void {
        localStorage.setItem("tokenExpried", expiredToken);
    }

    setToken(token: string): void {
        localStorage.setItem("tokenApp", token);
    }

    getToken(): string | null {
        return localStorage.getItem("tokenApp");
    }

    removeToken(): void {
        localStorage.removeItem("tokenApp");
        localStorage.removeItem("tokenExpried");
    }

    getUserInfo<T = unknown>(): T | null {
        const raw = localStorage.getItem("UserInfo");
        if (!raw) return null;
        return JSON.parse(raw) as T;
    }

    getUserID(): string | null {
        const userInfo = this.getUserInfo<{ user_id: string }>();
        return userInfo?.user_id ?? null;
    }

    randomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    mask(): void {
        const loading = document.getElementById("loader-main");
        if (loading) loading.style.display = "flex";
    }

    unmask(): void {
        const loading = document.getElementById("loader-main");
        if (loading) loading.style.display = "none";
    }

    convertValueByDataType(data: unknown, type: DataType): unknown {
        if (!data || !type) return data;

        switch (type.toLowerCase() as DataType) {
            case "string":
                return String(data);

            case "boolean":
                if (typeof data === "boolean") return data;
                switch (String(data).toLowerCase()) {
                    case "true":
                    case "1":
                    case "yes":
                        return true;
                    default:
                        return false;
                }

            case "number":
                if (typeof data === "number") return data;
                const cleaned = String(data).replace(/,/g, "");
                const parsed = Number.parseFloat(cleaned);
                return isNaN(parsed) ? data : parsed;

            default:
                return data;
        }
    }

    // getEnumField(enumName: string, value: unknown): string {
    //     const objEnum = (constant as Record<string, unknown>)[enumName];
    //     if (objEnum) return this.getKeyObjectByValue(objEnum as Record<string, unknown>, value) ?? "";
    //     return "";
    // }

    // getTextByEnumValue(enumName: string, value: unknown): string {
    //     const key = this.getEnumField(enumName, value);
    //     return i18n.global.t(`i18nEnum.${enumName}_${key}`);
    // }

    getKeyObjectByValue(obj: Record<string, unknown>, value: unknown): string | undefined {
        return Object.keys(obj).find((key) => obj[key] === value);
    }
}

export default new CommonFunction();
