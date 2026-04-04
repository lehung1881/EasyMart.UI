import { computed, onBeforeUnmount, reactive, ref, type Ref } from "vue";
import BaseAPI from "@/api/baseAPI";
import BaseModel from "@/models/common/baseModel";
import { ModelState } from "@/constants/enumration/modelState";
import { attachDetailDebug, detachDetailDebug } from "@/composables/base/useDebug";

/**
 * Trạng thái form chi tiết.
 * - 1: Thêm mới
 * - 2: Chỉnh sửa
 */
export type DetailFormState = 1 | 2;

/**
 * Payload callback trước khi lưu dữ liệu detail.
 */
export interface BeforeSaveContext<TModel extends BaseModel> {
    /** Dữ liệu model hiện tại trước khi gửi API. */
    model: TModel;
    /** Trạng thái form hiện tại. */
    formState: DetailFormState;
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
    formState: DetailFormState;
}

/**
 * Cấu hình khởi tạo cho useBaseDetail.
 */
export interface BaseDetailOptions<TModel extends BaseModel> {
    /** API instance dùng để gọi saveData. */
    api: BaseAPI;
    /** Hàm tạo dữ liệu mặc định ban đầu cho form. */
    createDefaultData: () => TModel;
    /** Callback validate/nghiệp vụ trước khi lưu. */
    validateBeforeSave?: (context: BeforeSaveContext<TModel>) => boolean | Promise<boolean>;
    /** Callback cho phép chỉnh payload trước khi lưu. */
    transformBeforeSave?: (context: BeforeSaveContext<TModel>) => Partial<TModel> & { ModelState?: number };
    /** Callback sau khi lưu thành công. */
    onSaveSuccess?: (context: SaveSuccessContext<TModel>) => void | Promise<void>;
    /** Callback khi lưu thất bại. */
    onSaveError?: (error: Error) => void | Promise<void>;
}

/**
 * Factory tạo composable dùng chung cho các màn hình detail.
 * @param options Cấu hình khởi tạo composable.
 * @returns Bộ state/hàm dùng chung cho luồng nhập liệu và lưu detail.
 */
export function useBaseDetail<TModel extends BaseModel>(options: BaseDetailOptions<TModel>) {
    const { api, createDefaultData } = options;

    const model = reactive(createDefaultData()) as TModel;
    const formState = ref<DetailFormState>(1);
    const saving = ref<boolean>(false);

    const isEditMode = computed<boolean>(() => formState.value === 2);
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
     * Khởi tạo form ở chế độ thêm mới.
     * @param payload Dữ liệu khởi tạo thêm (nếu có).
     * @returns Không trả về dữ liệu.
     */
    const createItem = (payload?: Partial<TModel>): void => {
        formState.value = 1;
        Object.assign(model, buildModel(payload));
    };

    /**
     * Khởi tạo form ở chế độ chỉnh sửa từ dữ liệu có sẵn.
     * @param payload Dữ liệu cần nạp để chỉnh sửa.
     * @returns Không trả về dữ liệu.
     */
    const editItem = (payload: Partial<TModel>): void => {
        formState.value = 2;
        Object.assign(model, buildModel(payload));
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
     * Reset dữ liệu form về trạng thái mặc định ban đầu.
     * @returns Không trả về dữ liệu.
     */
    const resetForm = (): void => {
        createItem();
    };

    /**
     * Suy luận model state cho lần lưu hiện tại dựa trên formState.
     * @returns Giá trị Insert hoặc Update.
     */
    const getModelStateForSave = (): number => {
        return formState.value === 2 ? ModelState.Update : ModelState.Insert;
    };

    /**
     * Tạo payload gửi API lưu dữ liệu từ state hiện tại của form.
     * @returns Payload đầy đủ gồm dữ liệu model và `ModelState`.
     */
    const getSavePayload = (): TModel & { ModelState: number } => {
        const beforeSaveContext: BeforeSaveContext<TModel> = {
            model,
            formState: formState.value,
        };

        const transformedPayload = options.transformBeforeSave?.(beforeSaveContext);
        const modelState = transformedPayload?.ModelState ?? getModelStateForSave();

        return {
            ...model,
            ...(transformedPayload ?? {}),
            ModelState: modelState,
        } as TModel & { ModelState: number };
    };

    /**
     * Lưu dữ liệu form detail qua API saveData.
     * @returns `true` nếu lưu thành công, ngược lại `false`.
     */
    const save = async (): Promise<boolean> => {
        if (saving.value) {
            return false;
        }

        const beforeSaveContext: BeforeSaveContext<TModel> = {
            model,
            formState: formState.value,
        };

        const canSave = (await options.validateBeforeSave?.(beforeSaveContext)) ?? true;
        if (!canSave) {
            return false;
        }

        const payload = getSavePayload();

        try {
            saving.value = true;
            const response = await api.saveData(payload);
            model.commit();
            await options.onSaveSuccess?.({
                payload,
                response,
                formState: formState.value,
            });
            return true;
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
        createItem,
        editItem,
        setFormData,
        resetForm,
        getSavePayload,
        save,
        saveAndClose,
    };

    attachDetailDebug(baseDetailInstance);

    onBeforeUnmount(() => {
        detachDetailDebug();
    });

    return baseDetailInstance;
}
