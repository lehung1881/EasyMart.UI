import { computed, onBeforeUnmount, reactive, ref, getCurrentInstance } from "vue";
import BaseAPI from "@/api/baseAPI";
import BaseModel from "@/models/common/baseModel";
import { attachDetailDebug, detachDetailDebug } from "@/composables/base/useDebug";
import { showError } from "@/commons/messageBox";
import { formConfigMap, type FormConfig } from "@/constants/staticConfig/FormConfig";
import { useToastMessage } from "@/composables/message/useToastMessage";
import { Constant } from '@/constants/constants.ts';

/**
 * Payload callback trước khi lưu dữ liệu detail.
 */
export interface BeforeSaveContext<TModel extends BaseModel> {
    /** Dữ liệu model hiện tại trước khi gửi API. */
    model: TModel;
    /** Trạng thái form hiện tại. */
    formState: number;
}

/**
 * Payload callback sau khi lưu dữ liệu detail thành công.
 */
export interface SaveSuccessContext<TModel extends BaseModel> {
    /** Dữ liệu model đã gửi đi (payload cuối cùng). */
    payload: TModel & { ModelState: number };
    /** Kết quả trả về từ API saveData. */
    response: unknown;
    /** Trạng thái form tại thời điểm lưu thành công. */
    formState: number;
}

/**
 * Cấu hình khởi tạo cho useBaseDetail.
 */
export interface BaseDetailOptions<TModel extends BaseModel> {
    /** API instance dùng để gọi saveData. */
    api: BaseAPI;
    /** ID của form. */
    formID: string;
    /** Hàm tạo dữ liệu mặc định ban đầu cho form. */
    createDefaultData: () => TModel;
    /** Callback validate/nghiệp vụ trước khi lưu. */
    customValidateBeforeSave?: () => boolean | Promise<boolean>;
    /** Callback cho phép chỉnh payload trước khi lưu. */
    transformBeforeSave?: () => any;
    /** Callback sau khi lưu thành công. */
    onSaveSuccess?: (context: SaveSuccessContext<TModel>) => void | Promise<void>;
    /** Callback khi lưu thất bại. */
    onSaveError?: (error: Error) => void | Promise<void>;
    /** Callback trước khi mở popup để bind dữ liệu vào form detail. */
    bindingData?: (formState: number, recordData?: any) => void;
}

/**
 * Factory tạo composable dùng chung cho các màn hình detail.
 * @param options Cấu hình khởi tạo composable.
 * @returns Bộ state/hàm dùng chung cho luồng nhập liệu và lưu detail.
 */
export function useBaseDetail<TModel extends BaseModel>(options: BaseDetailOptions<TModel>) {
    /**
     * Toast thông báo
     */
    const toast = useToastMessage();

    /**
     * Các phần chính của useBaseDetail
     */
    const { api, formID, createDefaultData } = options;

    /**
     * Lấy proxy của component để truy cập props hoặc options nếu cần thiết.
     */
    const { proxy } = getCurrentInstance() as any;

    /**
     * Cấu hình mặc định ban đầu của form
     */
    const staticConfig = formConfigMap.get(formID) as FormConfig;

    /**
     * Model reactive chứa dữ liệu form detail
     */
    const model = reactive(createDefaultData()) as TModel;

    /**
     * Trạng thái form hiện tại, mặc định là Add khi mở form detail mới, sẽ được cập nhật lại khi mở form detail với record cần edit.
     */
    const formState = ref<number>(Constant.FormState.Add);

    /**
     * Trạng thái đang lưu dữ liệu, dùng để disable nút lưu và tránh gọi API nhiều lần khi người dùng click liên tục.
     */
    const saving = ref<boolean>(false);

    /**
     * Computed property xác định xem form đang ở chế độ Edit hay Add, dùng để điều chỉnh giao diện hoặc logic nếu cần thiết.
     */
    const isEditMode = computed<boolean>(() => formState.value === Constant.FormState.Edit);

    /**
     * Computed property kiểm tra xem dữ liệu form đã có sự thay đổi so với trạng thái ban đầu hay chưa.
     */
    const hasChanges = computed<boolean>(() => model.checkChange());

    /**
     * Khởi tạo lại model theo payload truyền vào và chụp snapshot ban đầu.
     * @param payload Dữ liệu cần nạp vào model.
     * @returns Model đã được khởi tạo.
     */
    const buildModel = (payload?: Partial<TModel>): TModel => {
        const nextModel = createDefaultData();
        if (payload) {
            nextModel.applyData(payload);
        }
        nextModel.captureOriginalState();
        return nextModel;
    };

    /**
     * Cập nhật toàn bộ dữ liệu form từ payload truyền vào.
     * @param payload Dữ liệu muốn nạp vào form.
     * @returns Không trả về dữ liệu.
     */
    const setFormData = (payload?: Partial<TModel>): void => {
        Object.assign(model, buildModel(payload));
    };

    /**
     * Xử lý trước khi mở form detail
     * @param params
     */
    const beforeOpen = async ({ params }: any) => {
        try {
            const { FormState, RecordData, updateListCallback } = params || {};
            formState.value = FormState ?? Constant.FormState.Add;
            Object.assign(model, buildModel(RecordData));
            proxy.updateListCallback = typeof updateListCallback === "function" ? updateListCallback : null;
            options.bindingData?.(formState.value, RecordData);
        } catch (error) {
            console.error("[ERROR] beforeOpen:", error);
        }
    };

    /**
     * Suy luận model state cho lần lưu hiện tại dựa trên formState.
     * @returns Giá trị Insert hoặc Update.
     */
    const getModelStateForSave = (): number => {
        return formState.value === Constant.FormState.Edit ? Constant.ModelState.Update : Constant.ModelState.Insert;
    };

    /**
     * Tạo payload gửi API lưu dữ liệu từ state hiện tại của form.
     * @returns Payload đầy đủ gồm dữ liệu model và `ModelState`.
     */
    const getSavePayload = (): any & { ModelState: number } => {
        const transformedPayload = options.transformBeforeSave?.();
        const modelState = transformedPayload?.ModelState ?? getModelStateForSave();

        if (modelState === Constant.ModelState.Insert) {
            model.setAutoPrimaryKey();
        }

        return {
            ...model,
            ...(transformedPayload ?? {}),
            ModelState: modelState,
        };
    };

    /**
     * Thực hiện validate trước khi lưu, bao gồm validate model và custom validate nếu có.
     * @returns `true` nếu dữ liệu hợp lệ và có thể tiếp tục lưu, ngược lại `false`.
     */
    const validateBeforeSave = async (): Promise<boolean> => {
        // Validate model cơ bản
        const modelValidate = model.validate();
        if (!modelValidate.isValid) {
            showError(modelValidate.errors, "Cảnh báo");
            return false;
        }

        const customValidateResult = await options.customValidateBeforeSave?.();
        if (customValidateResult === false) {
            return false;
        }
        return true;
    };

    /**
     * Lưu dữ liệu form detail qua API saveData.
     * @returns `true` nếu lưu thành công, ngược lại `false`.
     */
    const save = async (): Promise<boolean> => {
        if (saving.value) {
            return false;
        }

        const canSave = await validateBeforeSave();
        if (!canSave) {
            return false;
        }

        const payload = getSavePayload();

        try {
            saving.value = true;
            const saveResult = await api.saveData(payload);

            if (saveResult && saveResult.Success) {
                model.commitChange();

                // Nếu có callback cập nhật lại list sau khi save thành công
                if (proxy.updateListCallback && typeof proxy.updateListCallback === "function") {
                    proxy.updateListCallback(payload);
                }

                await options.onSaveSuccess?.({
                    payload,
                    response: saveResult,
                    formState: formState.value,
                });

                toast.showSuccess("Lưu thành công", {
                    position: "top-center",
                });

                return true;
            }
            return false;
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Save detail failed");
            await options.onSaveError?.(normalizedError);
            return false;
        } finally {
            saving.value = false;
        }
    };

    /**
     * Lưu dữ liệu detail và đóng popup nếu lưu thành công.
     * @param close Hàm đóng popup.
     * @returns `true` nếu lưu thành công và đã xử lý đóng popup.
     */
    const saveAndClose = async (close: () => void): Promise<boolean> => {
        const saved = await save();
        if (saved) {
            close();
        }
        return saved;
    };

    const baseDetailInstance = {
        model,
        formState,
        saving,
        isEditMode,
        hasChanges,
        staticConfig,
        setFormData,
        getSavePayload,
        save,
        saveAndClose,
        beforeOpen,
    };

    attachDetailDebug(baseDetailInstance);

    onBeforeUnmount(() => {
        detachDetailDebug();
    });

    return baseDetailInstance;
}
