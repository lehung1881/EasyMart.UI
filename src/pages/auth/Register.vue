<template>
    <div class="page-wrapper">
        <div class="bg-layer">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
        </div>

        <div class="card">
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

            <h1 class="title">{{ $t("i18nAuth.Register.Title") }}</h1>
            <p class="subtitle">
                {{ $t("i18nAuth.Register.HasAccount") }}
                <a href="#" class="link" @click.prevent="goToLogin">{{ $t("i18nAuth.Register.LoginLink") }}</a>
            </p>

            <div class="form-content">
                <div class="form-grid">
                    <div class="field" :class="{ 'field-error': errors.TaxCode }">
                        <BaseInput
                            v-model="form.TaxCode"
                            size="lg"
                            :label="$t('i18nAuth.Register.FieldTaxCode')"
                            :placeholder="$t('i18nAuth.Register.FieldTaxCodePlaceholder')"
                            @blur="validateField('TaxCode')"
                            @update:modelValue="clearError('TaxCode')"
                        />
                        <span class="error-msg" v-if="errors.TaxCode">{{ errors.TaxCode }}</span>
                    </div>

                    <div class="field" :class="{ 'field-error': errors.EasyMartName }">
                        <BaseInput
                            v-model="form.EasyMartName"
                            size="lg"
                            :label="$t('i18nAuth.Register.FieldEasyMartName')"
                            :placeholder="$t('i18nAuth.Register.FieldEasyMartNamePlaceholder')"
                            @blur="validateField('EasyMartName')"
                            @update:modelValue="clearError('EasyMartName')"
                        />
                        <span class="error-msg" v-if="errors.EasyMartName">{{ errors.EasyMartName }}</span>
                    </div>

                    <div class="field" :class="{ 'field-error': errors.LastName }">
                        <BaseInput
                            v-model="form.LastName"
                            size="lg"
                            :label="$t('i18nAuth.Register.FieldLastName')"
                            :placeholder="$t('i18nAuth.Register.FieldLastNamePlaceholder')"
                            @blur="validateField('LastName')"
                            @update:modelValue="clearError('LastName')"
                        />
                        <span class="error-msg" v-if="errors.LastName">{{ errors.LastName }}</span>
                    </div>

                    <div class="field" :class="{ 'field-error': errors.FirstName }">
                        <BaseInput
                            v-model="form.FirstName"
                            size="lg"
                            :label="$t('i18nAuth.Register.FieldFirstName')"
                            :placeholder="$t('i18nAuth.Register.FieldFirstNamePlaceholder')"
                            @blur="validateField('FirstName')"
                            @update:modelValue="clearError('FirstName')"
                        />
                        <span class="error-msg" v-if="errors.FirstName">{{ errors.FirstName }}</span>
                    </div>

                    <div class="field" :class="{ 'field-error': errors.PhoneNumber }">
                        <BaseInput
                            v-model="form.PhoneNumber"
                            size="lg"
                            :label="$t('i18nAuth.Register.FieldPhone')"
                            :placeholder="$t('i18nAuth.Register.FieldPhonePlaceholder')"
                            @blur="validateField('PhoneNumber')"
                            @update:modelValue="clearError('PhoneNumber')"
                        />
                        <span class="error-msg" v-if="errors.PhoneNumber">{{ errors.PhoneNumber }}</span>
                    </div>

                    <div class="field" :class="{ 'field-error': errors.Email }">
                        <BaseInput
                            v-model="form.Email"
                            size="lg"
                            :label="$t('i18nAuth.Register.FieldEmail')"
                            :placeholder="$t('i18nAuth.Register.FieldEmailPlaceholder')"
                            @blur="validateField('Email')"
                            @update:modelValue="clearError('Email')"
                        />
                        <span class="error-msg" v-if="errors.Email">{{ errors.Email }}</span>
                    </div>

                    <div class="field" :class="{ 'field-error': errors.Password }">
                        <BaseInput
                            v-model="form.Password"
                            :type="showPassword ? 'text' : 'password'"
                            size="lg"
                            :label="$t('i18nAuth.Register.FieldPassword')"
                            :placeholder="$t('i18nAuth.Register.FieldPasswordPlaceholder')"
                            @blur="validateField('Password')"
                            @update:modelValue="clearError('Password')"
                        >
                            <template #right-icon>
                                <div
                                    @click="showPassword = !showPassword"
                                    :class="showPassword ? 'icon-eye-open' : 'icon-eye-closed'"
                                ></div>
                            </template>
                        </BaseInput>
                        <span class="error-msg" v-if="errors.Password">{{ errors.Password }}</span>
                    </div>

                    <div class="field" :class="{ 'field-error': errors.ConfirmPassword }">
                        <BaseInput
                            v-model="form.ConfirmPassword"
                            :type="showConfirmPassword ? 'text' : 'password'"
                            size="lg"
                            :label="$t('i18nAuth.Register.FieldConfirmPassword')"
                            :placeholder="$t('i18nAuth.Register.FieldConfirmPasswordPlaceholder')"
                            @blur="validateField('ConfirmPassword')"
                            @update:modelValue="clearError('ConfirmPassword')"
                        >
                            <template #right-icon>
                                <div
                                    @click="showConfirmPassword = !showConfirmPassword"
                                    :class="showConfirmPassword ? 'icon-eye-open' : 'icon-eye-closed'"
                                ></div>
                            </template>
                        </BaseInput>
                        <span class="error-msg" v-if="errors.ConfirmPassword">{{ errors.ConfirmPassword }}</span>
                    </div>
                </div>

                <div class="checkbox-row" :class="{ 'checkbox-error': errors.Terms }">
                    <BaseCheckbox v-model="form.Terms" @change="clearError('Terms')">
                        <template #label>
                            {{ $t("i18nAuth.Register.TermsText") }}
                        </template>
                    </BaseCheckbox>
                    <span class="error-msg" v-if="errors.Terms">{{ errors.Terms }}</span>
                </div>

                <span class="error-msg form-error" v-if="errors.Form">{{ errors.Form }}</span>

                <BaseButton
                    size="xxl"
                    variant="primary"
                    class="submit-btn"
                    :disabled="loading || submitted"
                    @click="handleSubmit"
                >
                    {{ $t("i18nAuth.Register.Submit") }}
                </BaseButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, getCurrentInstance } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth/authStore";
import type { RegisterRequest } from "@/models/auth/auth";

type RegisterField =
    | "TaxCode"
    | "EasyMartName"
    | "LastName"
    | "FirstName"
    | "Email"
    | "PhoneNumber"
    | "Password"
    | "ConfirmPassword"
    | "Terms";

type ErrorField = RegisterField | "Form";
type FieldValue = string | boolean;

interface ServerValidateInfo {
    Field?: string;
    Message?: string;
}

interface RegisterApiError {
    Message?: string;
    ValidateInfo?: ServerValidateInfo[];
}

interface RegisterForm extends RegisterRequest {
    LastName: string;
    FirstName: string;
    ConfirmPassword: string;
    Terms: boolean;
}

type FormErrors = Partial<Record<ErrorField, string>>;

const REGISTER_FIELDS: RegisterField[] = [
    "TaxCode",
    "EasyMartName",
    "LastName",
    "FirstName",
    "Email",
    "PhoneNumber",
    "Password",
    "ConfirmPassword",
    "Terms",
];

const ALLOWED_ERROR_FIELDS = new Set<ErrorField>([...REGISTER_FIELDS, "Form"]);

const router = useRouter();
const { proxy } = getCurrentInstance()!;
const authStore = useAuthStore();
const loading = ref(false);
const submitted = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive<RegisterForm>({
    TaxCode: "",
    EasyMartName: "",
    LastName: "",
    FirstName: "",
    FullName: "",
    Email: "",
    PhoneNumber: "",
    Password: "",
    ConfirmPassword: "",
    Terms: false,
});

const errors = reactive<FormErrors>({});

function t(key: string): string {
    return String(proxy!.$t(key));
}

const validators: Record<RegisterField, (value: FieldValue) => string | undefined> = {
    TaxCode: (value) => (!value ? t("i18nAuth.Register.ValidateTaxCodeRequired") : undefined),
    EasyMartName: (value) => (!value ? t("i18nAuth.Register.ValidateEasyMartNameRequired") : undefined),
    LastName: (value) => (!value ? t("i18nAuth.Register.ValidateLastNameRequired") : undefined),
    FirstName: (value) => (!value ? t("i18nAuth.Register.ValidateFirstNameRequired") : undefined),
    Email: (value) => {
        const email = String(value);
        if (!email) return t("i18nAuth.Register.ValidateEmailRequired");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t("i18nAuth.Register.ValidateEmailInvalid");
        return undefined;
    },
    PhoneNumber: (value) => {
        const phone = String(value).replace(/\s/g, "");
        if (!phone) return t("i18nAuth.Register.ValidatePhoneRequired");
        if (!/^(0|\+84)(3[2-9]|5[6-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{7}$/.test(phone)) {
            return t("i18nAuth.Register.ValidatePhoneInvalid");
        }
        return undefined;
    },
    Password: (value) => {
        const password = String(value);
        if (!password) return t("i18nAuth.Register.ValidatePasswordRequired");
        if (password.length < 8) return t("i18nAuth.Register.ValidatePasswordMinLength");
        if (!/[A-Z]/.test(password)) return t("i18nAuth.Register.ValidatePasswordUppercase");
        if (!/[a-z]/.test(password)) return t("i18nAuth.Register.ValidatePasswordLowercase");
        if (!/[0-9]/.test(password)) return t("i18nAuth.Register.ValidatePasswordNumber");
        if (!/[^A-Za-z0-9]/.test(password)) return t("i18nAuth.Register.ValidatePasswordSpecial");
        return undefined;
    },
    ConfirmPassword: (value) => {
        const confirmPassword = String(value);
        if (!confirmPassword) return t("i18nAuth.Register.ValidateConfirmPasswordRequired");
        if (confirmPassword !== form.Password) return t("i18nAuth.Register.ValidateConfirmPasswordMismatch");
        return undefined;
    },
    Terms: (value) => (!value ? t("i18nAuth.Register.ValidateTermsRequired") : undefined),
};

function validateField(field: RegisterField): void {
    const errorMessage = validators[field](form[field]);
    if (errorMessage) {
        errors[field] = errorMessage;
        return;
    }

    delete errors[field];
}

function clearError(field: ErrorField): void {
    delete errors[field];
}

function validateAll(): boolean {
    let isValid = true;
    REGISTER_FIELDS.forEach((field) => {
        validateField(field);
        if (errors[field]) {
            isValid = false;
        }
    });
    return isValid;
}

function buildRegisterPayload(): RegisterRequest {
    return {
        Email: form.Email,
        FullName: `${form.LastName} ${form.FirstName}`.trim(),
        Password: form.Password,
        PhoneNumber: form.PhoneNumber,
        EasyMartName: form.EasyMartName,
        TaxCode: form.TaxCode,
    };
}

function applyServerValidationErrors(error: RegisterApiError): void {
    if (!Array.isArray(error.ValidateInfo)) {
        return;
    }

    error.ValidateInfo.forEach((item) => {
        const field = item.Field as ErrorField | undefined;
        const message = item.Message;

        if (!field || !message || !ALLOWED_ERROR_FIELDS.has(field)) {
            return;
        }

        errors[field] = message;
    });
}

async function handleSubmit(): Promise<void> {
    if (!validateAll()) {
        return;
    }

    loading.value = true;
    clearError("Form");

    try {
        await authStore.register(buildRegisterPayload());
        submitted.value = true;
    } catch (error: unknown) {
        const registerError = error as RegisterApiError;
        applyServerValidationErrors(registerError);
        errors.Form = registerError.Message || t("i18nCommon.Error");
    } finally {
        loading.value = false;
    }
}

function goToLogin(): void {
    router.push({ name: "Login" });
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

.card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: none;
    border-radius: 24px;
    padding: 44px 48px;
    width: 100%;
    max-width: 640px;
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
    margin-bottom: 8px;
}

.subtitle {
    text-align: center;
    font-size: $font-size-base;
    color: #6b7280;
    margin-bottom: 24px;
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

.form-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

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

.checkbox-row {
    margin-top: 8px;
    margin-bottom: 8px;
}
.terms-link {
    margin-left: 4px;
}
.checkbox-error :deep(.base-checkbox__box) {
    border-color: #f43f5e;
}

.submit-btn {
    width: 100%;
}

@media (max-width: 520px) {
    .card {
        padding: 32px 24px;
    }
    .form-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}
</style>
