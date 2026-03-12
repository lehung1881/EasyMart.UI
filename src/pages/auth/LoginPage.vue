<template>
    <div class="page-wrapper">
        <!-- Animated background -->
        <div class="bg-layer">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
            <div class="grid-lines"></div>
        </div>

        <!-- Login Card -->
        <div class="card">
            <!-- Brand -->
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

            <!-- Tabs -->
            <div class="tab-group">
                <button :class="['tab-btn', activeTab === 'password' ? 'active' : '']" @click="activeTab = 'password'">
                    {{ $t("i18nAuth.Login.TabPassword") }}
                </button>
                <button :class="['tab-btn', activeTab === 'qr' ? 'active' : '']" @click="activeTab = 'qr'">
                    {{ $t("i18nAuth.Login.TabQr") }}
                </button>
            </div>

            <!-- Tab: Mật khẩu -->
            <div v-if="activeTab === 'password'" class="form-content">
                <!-- Username -->
                <div class="field" :class="{ 'field-error': errors.username, 'field-filled': form.username }">
                    <label class="label">{{ $t("i18nAuth.Login.FieldUsername") }}</label>
                    <div class="input-wrap">
                        <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.8" />
                            <path
                                d="M4 21c0-4 3.6-7 8-7s8 3 8 7"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                            />
                        </svg>
                        <input
                            v-model="form.username"
                            type="text"
                            :placeholder="$t('i18nAuth.Login.FieldUsernamePlaceholder')"
                            @blur="validateField('username')"
                            @input="clearError('username')"
                        />
                    </div>
                    <span class="error-msg" v-if="errors.username">{{ errors.username }}</span>
                </div>

                <!-- Password -->
                <div class="field" :class="{ 'field-error': errors.password, 'field-filled': form.password }">
                    <label class="label">{{ $t("i18nAuth.Login.FieldPassword") }}</label>
                    <div class="input-wrap">
                        <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8" />
                            <path
                                d="M7 11V7a5 5 0 0 1 10 0v4"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                            />
                        </svg>
                        <input
                            v-model="form.password"
                            :type="showPassword ? 'text' : 'password'"
                            :placeholder="$t('i18nAuth.Login.FieldPasswordPlaceholder')"
                            @blur="validateField('password')"
                            @input="clearError('password')"
                        />
                        <button class="toggle-password" type="button" @click="showPassword = !showPassword">
                            <svg v-if="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                />
                                <path
                                    d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                />
                                <line
                                    x1="1"
                                    y1="1"
                                    x2="23"
                                    y2="23"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                />
                            </svg>
                            <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
                            </svg>
                        </button>
                    </div>
                    <span class="error-msg" v-if="errors.password">{{ errors.password }}</span>
                </div>

                <!-- Forgot password -->
                <div class="forgot-row">
                    <button type="button" class="link">{{ $t("i18nAuth.Login.ForgotPassword") }}</button>
                </div>

                <!-- Submit -->
                <button
                    type="button"
                    class="submit-btn"
                    :class="{ 'btn-loading': loading, 'btn-success': submitted }"
                    :disabled="loading || submitted"
                    @click="handleLogin"
                >
                    <span class="btn-content" v-if="!loading && !submitted">
                        {{ $t("i18nAuth.Login.Submit") }}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M5 12h14M13 6l6 6-6 6"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </span>
                    <span class="btn-content" v-else-if="loading">
                        <span class="spinner"></span>
                        {{ $t("i18nCommon.Processing") }}
                    </span>
                    <span class="btn-content" v-else>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M5 13l4 4L19 7"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                        {{ $t("i18nCommon.Success") }}
                    </span>
                </button>

                <!-- Register link -->
                <p class="register-hint">
                    {{ $t("i18nAuth.Login.NoAccount") }}
                    <button type="button" class="link" @click="handleGoToRegister">
                        {{ $t("i18nAuth.Login.RegisterLink") }}
                    </button>
                </p>
            </div>

            <!-- Tab: QR -->
            <div v-if="activeTab === 'qr'" class="qr-content">
                <div class="qr-box">
                    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
                        <!-- QR decorative pattern -->
                        <rect
                            x="10"
                            y="10"
                            width="50"
                            height="50"
                            rx="6"
                            fill="none"
                            stroke="#0089c7"
                            stroke-width="3"
                        />
                        <rect x="20" y="20" width="30" height="30" rx="3" fill="#0089c7" />
                        <rect
                            x="80"
                            y="10"
                            width="50"
                            height="50"
                            rx="6"
                            fill="none"
                            stroke="#0089c7"
                            stroke-width="3"
                        />
                        <rect x="90" y="20" width="30" height="30" rx="3" fill="#0089c7" />
                        <rect
                            x="10"
                            y="80"
                            width="50"
                            height="50"
                            rx="6"
                            fill="none"
                            stroke="#0089c7"
                            stroke-width="3"
                        />
                        <rect x="20" y="90" width="30" height="30" rx="3" fill="#0089c7" />
                        <!-- dots -->
                        <rect x="80" y="80" width="10" height="10" rx="2" fill="#0089c7" />
                        <rect x="96" y="80" width="10" height="10" rx="2" fill="#0089c7" />
                        <rect x="112" y="80" width="18" height="10" rx="2" fill="#0089c7" />
                        <rect x="80" y="96" width="18" height="10" rx="2" fill="#0089c7" />
                        <rect x="104" y="96" width="10" height="10" rx="2" fill="#0089c7" />
                        <rect x="80" y="112" width="10" height="18" rx="2" fill="#0089c7" />
                        <rect x="96" y="112" width="18" height="10" rx="2" fill="#0089c7" />
                        <rect x="120" y="108" width="10" height="22" rx="2" fill="#0089c7" />
                    </svg>
                    <p class="qr-text">{{ $t("i18nAuth.Login.QrHint") }} <strong>Easy Mart</strong></p>
                    <p class="qr-sub">{{ $t("i18nAuth.Login.QrSteps") }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, getCurrentInstance } from "vue";
import { useRouter } from "vue-router";

const { proxy } = getCurrentInstance()!;

type TabType = "password" | "qr";

const activeTab = ref<TabType>("password");
const showPassword = ref<boolean>(false);
const loading = ref(false);
const submitted = ref(false);

const form = reactive({ username: "", password: "" });
const errors = reactive<{ username?: string; password?: string }>({});

function validateField(field: "username" | "password") {
    if (!form[field]) {
        errors[field] =
            field === "username"
                ? proxy!.$t("i18nAuth.Login.ValidateUsernameRequired")
                : proxy!.$t("i18nAuth.Login.ValidatePasswordRequired");
    } else {
        delete errors[field];
    }
}

function clearError(field: "username" | "password") {
    delete errors[field];
}

async function handleLogin() {
    validateField("username");
    validateField("password");
    if (errors.username || errors.password) return;
    loading.value = true;
    await new Promise((r) => setTimeout(r, 1800));
    loading.value = false;
    submitted.value = true;
}

const router = useRouter();

function handleGoToRegister() {
    router.push({ name: "Register" });
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap");

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
    background: #f0f4f8;
    font-family: "DM Sans", sans-serif;
    padding: 24px;
    position: relative;
    overflow: hidden;
}

/* Animated background */
.bg-layer {
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
    background: radial-gradient(circle, rgba(0, 137, 199, 0.12) 0%, transparent 70%);
    top: -100px;
    left: -100px;
    animation-delay: 0s;
}
.orb-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
    bottom: -80px;
    right: -80px;
    animation-delay: -4s;
}
.orb-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -8s;
}
.grid-lines {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(0, 137, 199, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 137, 199, 0.06) 1px, transparent 1px);
    background-size: 40px 40px;
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

/* Card */
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

/* Brand */
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
    font-family: "Sora", sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #003d5c;
    letter-spacing: -0.5px;
}
.brand-name span {
    color: #10b981;
}

.title {
    font-family: "Sora", sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #003d5c;
    text-align: center;
    letter-spacing: -0.8px;
    margin-bottom: 20px;
}

/* Tabs */
.tab-group {
    display: flex;
    border-bottom: 2px solid #e5e7eb;
    margin-bottom: 28px;
}
.tab-btn {
    flex: 1;
    background: none;
    border: none;
    padding: 10px 0;
    font-family: "DM Sans", sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #9ca3af;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
}
.tab-btn.active {
    color: #0089c7;
    font-weight: 600;
}
.tab-btn.active::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: #0089c7;
    border-radius: 2px 2px 0 0;
}

/* Form */
.form-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Field */
.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.label {
    font-size: 12.5px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.6px;
}
.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}
.input-icon {
    position: absolute;
    left: 14px;
    color: #9ca3af;
    pointer-events: none;
    transition: color 0.2s;
}
.input-wrap input {
    width: 100%;
    padding: 12px 14px 12px 40px;
    background: #f9fafb;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    color: #111827;
    font-family: "DM Sans", sans-serif;
    font-size: 14.5px;
    outline: none;
    transition: all 0.25s ease;
}
.input-wrap input::placeholder {
    color: #d1d5db;
}
.input-wrap input:focus {
    border-color: #0089c7;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(0, 137, 199, 0.12);
}
.input-wrap:focus-within .input-icon {
    color: #0089c7;
}
.field-filled .input-wrap input {
    border-color: #d1d5db;
    background: #fff;
}
.field-error .input-wrap input {
    border-color: #f43f5e;
    background: #fff5f7;
}
.field-error .input-wrap input:focus {
    box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.12);
}

.toggle-password {
    position: absolute;
    right: 14px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: #9ca3af;
    display: flex;
    align-items: center;
    transition: color 0.2s;
}
.toggle-password:hover {
    color: #0089c7;
}

.error-msg {
    font-size: 12px;
    color: #f43f5e;
    animation: fadeIn 0.2s ease;
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

/* Forgot */
.forgot-row {
    display: flex;
    justify-content: flex-end;
    margin-top: -6px;
}
.link {
    background: none;
    border: none;
    padding: 0;
    font-family: "DM Sans", sans-serif;
    font-size: 13.5px;
    color: #0089c7;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s;
}
.link:hover {
    color: #007ab3;
    text-decoration: underline;
}

/* Submit */
.submit-btn {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #0089c7 0%, #007ab3 100%);
    border: none;
    border-radius: 14px;
    color: white;
    font-family: "Sora", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 137, 199, 0.35);
    letter-spacing: -0.2px;
}
.submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0, 137, 199, 0.5);
    background: linear-gradient(135deg, #33a3d4 0%, #0089c7 100%);
}
.submit-btn:active:not(:disabled) {
    transform: translateY(0);
}
.submit-btn:disabled {
    cursor: not-allowed;
    opacity: 0.8;
}
.btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4) !important;
}
.btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
.spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Register hint */
.register-hint {
    text-align: center;
    font-size: 13.5px;
    color: #6b7280;
    margin-top: -4px;
}

/* Divider */
.divider {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #9ca3af;
    font-size: 13px;
}
.divider::before,
.divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e5e7eb;
}

/* QR */
.qr-content {
    display: flex;
    justify-content: center;
    padding: 12px 0 4px;
}
.qr-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 28px 32px;
    border: 1.5px dashed rgba(0, 137, 199, 0.3);
    border-radius: 20px;
    background: rgba(0, 137, 199, 0.03);
}
.qr-text {
    font-size: 14px;
    color: #374151;
    text-align: center;
}
.qr-sub {
    font-size: 12.5px;
    color: #9ca3af;
    text-align: center;
}

@media (max-width: 480px) {
    .card {
        padding: 32px 24px;
    }
}
</style>
