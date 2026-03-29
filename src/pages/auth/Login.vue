<template>
    <div class="page-wrapper">
        <!-- Nền động -->
        <div class="bg-layer">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
        </div>

        <!-- Thẻ đăng nhập -->
        <div class="card">
            <!-- Thương hiệu -->
            <div class="brand">
                <div class="brand-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path
                            d="M4 8h20M4 8l2 14h16l2-14M4 8L7 4h14l3 4"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <circle cx="10" cy="25" r="1.5" fill="currentColor" />
                        <circle cx="18" cy="25" r="1.5" fill="currentColor" />
                    </svg>
                </div>
                <span class="brand-name">Easy<span>Mart</span></span>
            </div>

            <h1 class="title">{{ $t("i18nAuth.Login.Title") }}</h1>

            <!-- Form: Mật khẩu -->
            <div class="form-content">
                <!-- Tên đăng nhập -->
                <div class="field" :class="{ 'field-error': errors.username }">
                    <BaseInput
                        v-model="form.username"
                        size="lg"
                        :label="$t('i18nAuth.Login.FieldUsername')"
                        :placeholder="$t('i18nAuth.Login.FieldUsernamePlaceholder')"
                        @blur="validateField('username')"
                        @update:modelValue="clearError('username')"
                    />
                    <span class="error-msg" v-if="errors.username">{{ errors.username }}</span>
                </div>

                <!-- Mật khẩu -->
                <div class="field" :class="{ 'field-error': errors.password }">
                    <BaseInput
                        v-model="form.password"
                        size="lg"
                        :type="showPassword ? 'text' : 'password'"
                        :label="$t('i18nAuth.Login.FieldPassword')"
                        :placeholder="$t('i18nAuth.Login.FieldPasswordPlaceholder')"
                        @blur="validateField('password')"
                        @update:modelValue="clearError('password')"
                    >
                        <template #right-icon>
                            <div
                                @click="showPassword = !showPassword"
                                :class="showPassword ? 'icon-eye-open' : 'icon-eye-closed'"
                            ></div>
                        </template>
                    </BaseInput>
                    <span class="error-msg" v-if="errors.password">{{ errors.password }}</span>
                </div>

                <!-- Quên mật khẩu -->
                <div class="forgot-row">
                    <button type="button" class="link">{{ $t("i18nAuth.Login.ForgotPassword") }}</button>
                </div>

                <span class="error-msg form-error" v-if="errors.form">{{ errors.form }}</span>

                <!-- Nút đăng nhập -->
                <BaseButton size="xxl" variant="primary" :disabled="loading || submitted" @click="handleLogin">
                    {{ $t("i18nAuth.Login.Submit") }}
                </BaseButton>

                <!-- Liên kết đăng ký -->
                <p class="register-hint">
                    {{ $t("i18nAuth.Login.NoAccount") }}
                    <button type="button" class="link" @click="handleGoToRegister">
                        {{ $t("i18nAuth.Login.RegisterLink") }}
                    </button>
                </p>
            </div>
        </div>
        <!-- Trong HTML -->
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, getCurrentInstance } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth/authStore";
import type { LoginRequest } from "@/models/auth/auth";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";

type LoginField = "username" | "password";
type LoginErrorField = LoginField | "form";
type LoginErrors = Partial<Record<LoginErrorField, string>>;

interface LoginApiError {
    Message?: string;
}

const { proxy } = getCurrentInstance()!;

const loading = ref(false);
const submitted = ref(false);
const showPassword = ref(false);

const form = reactive<Record<LoginField, string>>({ username: "", password: "" });
const errors = reactive<LoginErrors>({});
const router = useRouter();
const authStore = useAuthStore();

/**
 * Dịch key i18n sang chuỗi hiển thị.
 * @param key Khóa i18n cần dịch.
 * @returns Chuỗi sau khi dịch.
 */
function t(key: string): string {
    return String(proxy!.$t(key));
}

/**
 * Kiểm tra hợp lệ cho một trường đăng nhập.
 * @param field Tên trường cần kiểm tra.
 * @returns Không trả dữ liệu.
 */
function validateField(field: LoginField): void {
    if (!form[field]) {
        errors[field] =
            field === "username"
                ? t("i18nAuth.Login.ValidateUsernameRequired")
                : t("i18nAuth.Login.ValidatePasswordRequired");
    } else {
        delete errors[field];
    }
}

/**
 * Xóa lỗi của một trường đăng nhập.
 * @param field Tên trường lỗi cần xóa.
 * @returns Không trả dữ liệu.
 */
function clearError(field: LoginField): void {
    delete errors[field];
}

/**
 * Xóa lỗi tổng quát của form.
 * @returns Không trả dữ liệu.
 */
function clearFormError(): void {
    delete errors.form;
}

/**
 * Kiểm tra toàn bộ form đăng nhập.
 * @returns `true` nếu hợp lệ, ngược lại `false`.
 */
function validateAll(): boolean {
    validateField("username");
    validateField("password");
    return !errors.username && !errors.password;
}

/**
 * Tạo payload đăng nhập theo contract API.
 * @returns Dữ liệu đúng kiểu `LoginRequest`.
 */
function buildLoginPayload(): LoginRequest {
    return {
        Email: form.username.trim(),
        Password: form.password,
    };
}

/**
 * Gửi form đăng nhập và xử lý trạng thái UI.
 * @returns Promise hoàn tất đăng nhập.
 */
async function handleLogin(): Promise<void> {
    clearFormError();
    submitted.value = false;

    if (!validateAll()) return;

    loading.value = true;

    try {
        await authStore.login(buildLoginPayload());
        submitted.value = true;
        await router.push({ name: "Dashboard" });
    } catch (error: unknown) {
        const loginError = error as LoginApiError;
        errors.form = loginError.Message || t("i18nCommon.Error");
        submitted.value = false;
    } finally {
        loading.value = false;
    }
}

/**
 * Điều hướng người dùng sang trang đăng ký.
 * @returns Không trả dữ liệu.
 */
function handleGoToRegister(): void {
    router.push({ name: "Register" });
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

.page-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    font-family: $font-family-base;
    font-size: $font-size-base;
    padding: 24px;
    position: relative;
    overflow: hidden;
}

/* Nền động */
.bg-layer {
    display: none;
    position: fixed;
    inset: 0;
    pointer-events: none;
}
.orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: drift 12s ease-in-out infinite;
}
.orb-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 137, 199, 0.1) 0%, transparent 70%);
    top: -100px;
    left: -100px;
    animation-delay: 0s;
}
.orb-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
    bottom: -80px;
    right: -80px;
    animation-delay: -4s;
}
.orb-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -8s;
}
@keyframes drift {
    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(30px, -20px) scale(1.05);
    }
    66% {
        transform: translate(-20px, 30px) scale(0.95);
    }
}

/* Thẻ đăng nhập */
.card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: none;
    border-radius: 24px;
    padding: 44px 48px;
    width: 100%;
    max-width: 440px;
    position: relative;
    z-index: 10;
    box-shadow:
        0 24px 64px rgba(0, 137, 199, 0.1),
        0 8px 32px rgba(0, 0, 0, 0.08);
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(32px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Thương hiệu */
.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: center;
    margin-bottom: 20px;
}
.brand-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #0089c7, #007ab3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 16px rgba(0, 137, 199, 0.35);
}
.brand-name {
    font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: 700;
    color: #003d5c;
    letter-spacing: -0.5px;
}
.brand-name span {
    color: #10b981;
}

.title {
    font-family: $font-family-base;
    font-size: 24px;
    font-weight: 700;
    color: #003d5c;
    text-align: center;
    letter-spacing: -0.8px;
    margin-bottom: 20px;
}

/* Biểu mẫu */
.form-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* Trường nhập */
.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.field-error :deep(.base-input) {
    border-color: #f43f5e;
}
.field-error :deep(.base-input:focus-visible) {
    border-color: #f43f5e;
}

.eye-icon-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: opacity 0.2s ease;
    opacity: 0.7;
}

.eye-icon-btn:hover {
    opacity: 1;
}

.eye-icon-btn span {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.error-msg {
    font-size: $font-size-base;
    color: #f43f5e;
    animation: fadeIn 0.2s ease;
}
.form-error {
    display: block;
    text-align: center;
    margin-top: -8px;
    margin-bottom: 2px;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Quên mật khẩu */
.forgot-row {
    display: flex;
    justify-content: flex-end;
    margin-top: -6px;
}
.link {
    background: none;
    border: none;
    padding: 0;
    font-family: $font-family-base;
    font-size: $font-size-base;
    color: rgba($primary-color, 0.82);
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s;
}
.link:hover {
    color: $primary-color;
    text-decoration: underline;
}

/* Nút gửi */
.submit-btn {
    width: 100%;
}

/* Gợi ý đăng ký */
.register-hint {
    text-align: center;
    font-size: $font-size-base;
    color: #6b7280;
    margin-top: -4px;
}

@media (max-width: 480px) {
    .card {
        padding: 32px 24px;
    }
}
</style>
