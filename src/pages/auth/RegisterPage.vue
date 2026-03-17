<template>
    <div class="page-wrapper">
        <!-- Animated background -->
        <div class="bg-layer">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
        </div>

        <!-- Form Card -->
        <div class="card" :class="{ 'card-submitted': submitted }">
            <!-- Logo / Brand -->
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

            <div>
                <div class="form-grid">
                    <!-- Tax ID -->
                    <div class="field" :class="{ 'field-error': errors.TaxCode, 'field-filled': form.TaxCode }">
                        <label class="label">{{ $t("i18nAuth.Register.FieldTaxCode") }}</label>
                        <div class="input-wrap">
                            <input
                                v-model="form.TaxCode"
                                type="text"
                                :placeholder="$t('i18nAuth.Register.FieldTaxCodePlaceholder')"
                                @blur="validateField('TaxCode')"
                                @input="clearError('TaxCode')"
                            />
                        </div>
                        <span class="error-msg" v-if="errors.TaxCode">{{ errors.TaxCode }}</span>
                    </div>

                    <!-- Company Name -->
                    <div class="field" :class="{ 'field-error': errors.TenantName, 'field-filled': form.TenantName }">
                        <label class="label">{{ $t("i18nAuth.Register.FieldTenantName") }}</label>
                        <div class="input-wrap">
                            <input
                                v-model="form.TenantName"
                                type="text"
                                :placeholder="$t('i18nAuth.Register.FieldTenantNamePlaceholder')"
                                @blur="validateField('TenantName')"
                                @input="clearError('TenantName')"
                            />
                        </div>
                        <span class="error-msg" v-if="errors.TenantName">{{ errors.TenantName }}</span>
                    </div>

                    <!-- Last Name -->
                    <div class="field" :class="{ 'field-error': errors.LastName, 'field-filled': form.LastName }">
                        <label class="label">{{ $t("i18nAuth.Register.FieldLastName") }}</label>
                        <div class="input-wrap">
                            <input
                                v-model="form.LastName"
                                type="text"
                                :placeholder="$t('i18nAuth.Register.FieldLastNamePlaceholder')"
                                @blur="validateField('LastName')"
                                @input="clearError('LastName')"
                            />
                        </div>
                        <span class="error-msg" v-if="errors.LastName">{{ errors.LastName }}</span>
                    </div>

                    <!-- First Name -->
                    <div class="field" :class="{ 'field-error': errors.FirstName, 'field-filled': form.FirstName }">
                        <label class="label">{{ $t("i18nAuth.Register.FieldFirstName") }}</label>
                        <div class="input-wrap">
                            <input
                                v-model="form.FirstName"
                                type="text"
                                :placeholder="$t('i18nAuth.Register.FieldFirstNamePlaceholder')"
                                @blur="validateField('FirstName')"
                                @input="clearError('FirstName')"
                            />
                        </div>
                        <span class="error-msg" v-if="errors.FirstName">{{ errors.FirstName }}</span>
                    </div>

                    <!-- Email -->
                    <div class="field" :class="{ 'field-error': errors.Email, 'field-filled': form.Email }">
                        <label class="label">{{ $t("i18nAuth.Register.FieldEmail") }}</label>
                        <div class="input-wrap">
                            <input
                                v-model="form.Email"
                                type="email"
                                :placeholder="$t('i18nAuth.Register.FieldEmailPlaceholder')"
                                @blur="validateField('Email')"
                                @input="clearError('Email')"
                            />
                        </div>
                        <span class="error-msg" v-if="errors.Email">{{ errors.Email }}</span>
                    </div>

                    <!-- Phone -->
                    <div class="field" :class="{ 'field-error': errors.PhoneNumber, 'field-filled': form.PhoneNumber }">
                        <label class="label">{{ $t("i18nAuth.Register.FieldPhone") }}</label>
                        <div class="input-wrap">
                            <input
                                v-model="form.PhoneNumber"
                                type="tel"
                                :placeholder="$t('i18nAuth.Register.FieldPhonePlaceholder')"
                                @blur="validateField('PhoneNumber')"
                                @input="clearError('PhoneNumber')"
                            />
                        </div>
                        <span class="error-msg" v-if="errors.PhoneNumber">{{ errors.PhoneNumber }}</span>
                    </div>

                    <!-- Password -->
                    <div class="field" :class="{ 'field-error': errors.Password, 'field-filled': form.Password }">
                        <label class="label">{{ $t("i18nAuth.Register.FieldPassword") }}</label>
                        <div class="input-wrap">
                            <input
                                v-model="form.Password"
                                :type="showPassword ? 'text' : 'password'"
                                :placeholder="$t('i18nAuth.Register.FieldPasswordPlaceholder')"
                                @blur="validateField('Password')"
                                @input="clearError('Password')"
                            />
                            <button class="toggle-password" type="button" @click="showPassword = !showPassword">
                                <svg v-if="!showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none">
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
                                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none">
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
                        <span class="error-msg" v-if="errors.Password">{{ errors.Password }}</span>
                    </div>

                    <!-- Confirm Password -->
                    <div
                        class="field"
                        :class="{ 'field-error': errors.ConfirmPassword, 'field-filled': form.ConfirmPassword }"
                    >
                        <label class="label">{{ $t("i18nAuth.Register.FieldConfirmPassword") }}</label>
                        <div class="input-wrap">
                            <input
                                v-model="form.ConfirmPassword"
                                :type="showConfirmPassword ? 'text' : 'password'"
                                :placeholder="$t('i18nAuth.Register.FieldConfirmPasswordPlaceholder')"
                                @blur="validateField('ConfirmPassword')"
                                @input="clearError('ConfirmPassword')"
                            />
                            <button
                                class="toggle-password"
                                type="button"
                                @click="showConfirmPassword = !showConfirmPassword"
                            >
                                <svg v-if="!showConfirmPassword" width="15" height="15" viewBox="0 0 24 24" fill="none">
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
                                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none">
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
                        <span class="error-msg" v-if="errors.ConfirmPassword">{{ errors.ConfirmPassword }}</span>
                    </div>
                </div>

                <!-- Terms checkbox -->
                <div class="checkbox-row" :class="{ 'checkbox-error': errors.Terms }">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="form.Terms" @change="clearError('Terms')" />
                        <span class="checkmark">
                            <svg v-if="form.Terms" width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path
                                    d="M1 4l3 3 5-6"
                                    stroke="white"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </span>
                        <span class="checkbox-text">
                            {{ $t("i18nAuth.Register.TermsText") }}
                            <a href="#" class="link">{{ $t("i18nAuth.Register.TermsLink") }}</a>
                        </span>
                    </label>
                    <span class="error-msg" v-if="errors.Terms">{{ errors.Terms }}</span>
                </div>

                <span class="error-msg form-error" v-if="errors.Form">{{ errors.Form }}</span>

                <!-- Submit -->
                <button
                    type="button"
                    class="submit-btn"
                    :class="{ 'btn-loading': loading, 'btn-success': submitted }"
                    :disabled="loading || submitted"
                    @click="handleSubmit"
                >
                    <span class="btn-content" v-if="!loading && !submitted">
                        {{ $t("i18nAuth.Register.Submit") }}
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
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, getCurrentInstance } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth/auth.store";
import type { RegisterRequest } from "@/models/auth/auth.model";

// Form UI mở rộng thêm LastName, FirstName, ConfirmPassword, Terms (không gửi lên server)
interface RegisterForm extends RegisterRequest {
    LastName: string;
    FirstName: string;
    ConfirmPassword: string;
    Terms: boolean;
}

interface FormErrors {
    TaxCode?: string;
    TenantName?: string;
    LastName?: string;
    FirstName?: string;
    Email?: string;
    PhoneNumber?: string;
    Password?: string;
    ConfirmPassword?: string;
    Terms?: string;
    Form?: string;
}

export default defineComponent({
    name: "RegisterForm",
    setup() {
        const router = useRouter();
        const { proxy } = getCurrentInstance()!;
        const authStore = useAuthStore();
        const showPassword = ref(false);
        const showConfirmPassword = ref(false);

        const form = reactive<RegisterForm>({
            TaxCode: "",
            TenantName: "",
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
        const loading = ref(false);
        const submitted = ref(false);

        const validators: Record<string, (val: string | boolean) => string | undefined> = {
            TaxCode: (v) => (!v ? proxy!.$t("i18nAuth.Register.ValidateTaxCodeRequired") : undefined),
            TenantName: (v) => (!v ? proxy!.$t("i18nAuth.Register.ValidateTenantNameRequired") : undefined),
            LastName: (v) => (!v ? proxy!.$t("i18nAuth.Register.ValidateLastNameRequired") : undefined),
            FirstName: (v) => (!v ? proxy!.$t("i18nAuth.Register.ValidateFirstNameRequired") : undefined),
            Email: (v) => {
                if (!v) return proxy!.$t("i18nAuth.Register.ValidateEmailRequired");
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v as string))
                    return proxy!.$t("i18nAuth.Register.ValidateEmailInvalid");
                return undefined;
            },
            PhoneNumber: (v) => {
                if (!v) return proxy!.$t("i18nAuth.Register.ValidatePhoneRequired");
                if (!/^(0|\+84)(3[2-9]|5[6-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{7}$/.test((v as string).replace(/\s/g, "")))
                    return proxy!.$t("i18nAuth.Register.ValidatePhoneInvalid");
                return undefined;
            },
            Password: (v) => {
                const s = v as string;
                if (!s) return proxy!.$t("i18nAuth.Register.ValidatePasswordRequired");
                if (s.length < 8) return proxy!.$t("i18nAuth.Register.ValidatePasswordMinLength");
                if (!/[A-Z]/.test(s)) return proxy!.$t("i18nAuth.Register.ValidatePasswordUppercase");
                if (!/[a-z]/.test(s)) return proxy!.$t("i18nAuth.Register.ValidatePasswordLowercase");
                if (!/[0-9]/.test(s)) return proxy!.$t("i18nAuth.Register.ValidatePasswordNumber");
                if (!/[^A-Za-z0-9]/.test(s)) return proxy!.$t("i18nAuth.Register.ValidatePasswordSpecial");
                return undefined;
            },
            ConfirmPassword: (v) => {
                if (!v) return proxy!.$t("i18nAuth.Register.ValidateConfirmPasswordRequired");
                if (v !== form.Password) return proxy!.$t("i18nAuth.Register.ValidateConfirmPasswordMismatch");
                return undefined;
            },
            Terms: (v) => (!v ? proxy!.$t("i18nAuth.Register.ValidateTermsRequired") : undefined),
        };

        function validateField(field: keyof FormErrors) {
            const val = (form as any)[field];
            const err = validators[field]?.(val);
            if (err) {
                (errors as any)[field] = err;
            } else {
                delete (errors as any)[field];
            }
        }

        function clearError(field: keyof FormErrors) {
            delete (errors as any)[field];
        }

        function validateAll(): boolean {
            let valid = true;
            (Object.keys(validators) as (keyof FormErrors)[]).forEach((field) => {
                validateField(field);
                if ((errors as any)[field]) valid = false;
            });
            return valid;
        }

        async function handleSubmit() {
            if (!validateAll()) return;
            loading.value = true;
            errors.Form = undefined;

            // Build payload khớp RegisterRequest gửi lên server
            const payload: RegisterRequest = {
                Email: form.Email,
                FullName: `${form.LastName} ${form.FirstName}`.trim(),
                Password: form.Password,
                PhoneNumber: form.PhoneNumber,
                TenantName: form.TenantName,
                TaxCode: form.TaxCode,
            };

            try {
                await authStore.register(payload);
                submitted.value = true;
            } catch (err: any) {
                const validateInfo = err?.ValidateInfo;
                if (Array.isArray(validateInfo)) {
                    const allowedFields: (keyof FormErrors)[] = [
                        "TaxCode",
                        "TenantName",
                        "LastName",
                        "FirstName",
                        "Email",
                        "PhoneNumber",
                        "Password",
                        "ConfirmPassword",
                        "Terms",
                        "Form",
                    ];
                    for (const item of validateInfo) {
                        const field = item?.Field as keyof FormErrors;
                        const message = item?.Message as string | undefined;
                        if (field && message && allowedFields.includes(field)) errors[field] = message;
                    }
                }
                errors.Form = err?.Message || proxy!.$t("i18nCommon.Error");
            } finally {
                loading.value = false;
            }
        }

        function goToLogin() {
            router.push({ name: "Login" });
        }

        return {
            form,
            errors,
            loading,
            submitted,
            showPassword,
            showConfirmPassword,
            validateField,
            clearError,
            handleSubmit,
            goToLogin,
        };
    },
});
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
    background: #ffffff;
    font-family: "DM Sans", sans-serif;
    padding: 24px;
    position: relative;
    overflow: hidden;
}

/* Animated background */
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
.grid-lines {
    display: none;
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(0, 137, 199, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 137, 199, 0.05) 1px, transparent 1px);
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
    max-width: 640px;
    position: relative;
    z-index: 10;
    box-shadow:
        0 24px 64px rgba(0, 137, 199, 0.1),
        0 8px 32px rgba(0, 0, 0, 0.08);
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.card-submitted {
    box-shadow:
        0 24px 64px rgba(16, 185, 129, 0.12),
        0 8px 32px rgba(0, 0, 0, 0.08);
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
    margin-bottom: 28px;
}
.brand-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #0089c7, #10b981);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 16px rgba(0, 137, 199, 0.4);
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

/* Title */
.title {
    font-family: "Sora", sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #003d5c;
    text-align: center;
    letter-spacing: -0.8px;
    margin-bottom: 8px;
}
.subtitle {
    text-align: center;
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 36px;
}
.link {
    color: #0089c7;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
}
.link:hover {
    color: #33a3d4;
    text-decoration: underline;
}

/* Form grid */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
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
.input-wrap input {
    width: 100%;
    padding: 12px 14px;
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
.input-wrap:focus-within .field-filled .input-wrap input {
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
.form-error {
    display: block;
    text-align: center;
    margin-top: -10px;
    margin-bottom: 14px;
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

/* Checkbox */
.checkbox-row {
    margin-top: 22px;
    margin-bottom: 24px;
}
.checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
    display: none;
}
.checkmark {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border: 1.5px solid #d1d5db;
    border-radius: 6px;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin-top: 1px;
}
.checkbox-label:has(input:checked) .checkmark {
    background: #0089c7;
    border-color: #0089c7;
    box-shadow: 0 2px 8px rgba(0, 137, 199, 0.35);
}
.checkbox-text {
    font-size: 13.5px;
    color: #6b7280;
    line-height: 1.5;
}
.checkbox-error .checkmark {
    border-color: #f43f5e;
}

/* Submit button */
.submit-btn {
    width: 100%;
    padding: 15px 24px;
    background: linear-gradient(135deg, #0089c7 0%, #007ab3 100%);
    border: none;
    border-radius: 14px;
    color: white;
    font-family: "Sora", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 137, 199, 0.4);
    letter-spacing: -0.2px;
}
.submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0, 137, 199, 0.55);
    background: linear-gradient(135deg, #33a3d4 0%, #0089c7 100%);
}
.submit-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 16px rgba(0, 137, 199, 0.35);
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

/* Spinner */
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

/* Responsive */
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
