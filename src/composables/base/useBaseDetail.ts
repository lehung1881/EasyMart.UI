import { computed, onBeforeUnmount, onMounted, reactive, ref, getCurrentInstance } from "vue";
import BaseAPI from "@/api/baseAPI";
import BaseModel from "@/models/common/baseModel";
import { ModelState, FormState } from "@/constants/enumration/modelState";
import { attachDetailDebug, detachDetailDebug } from "@/composables/base/useDebug";
import { showError } from "@/commons/messageBox";
import { formConfigMap, type FormConfig } from "@/constants/formConfig";

/**
 * Payload callback trước khi lưu dữ liệu detail.
 */
export interface BeforeSaveContext<TModel extends BaseModel> {
    /** Dữ liệu model hiện tại trước khi gửi API. */
    model: TModel;
    /** Trạng thái form hiện tại. */
    formState: FormState;
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
    formState: FormState;
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
    customValidateBeforeSave?: (context: BeforeSaveContext<TModel>) => boolean | Promise<boolean>;
    /** Callback cho phép chỉnh payload trước khi lưu. */
    transformBeforeSave?: (context: BeforeSaveContext<TModel>) => Partial<TModel> & { ModelState?: number };
    /** Callback sau khi lưu thành công. */
    onSaveSuccess?: (context: SaveSuccessContext<TModel>) => void | Promise<void>;
    /** Callback khi lưu thất bại. */
    onSaveError?: (error: Error) => void | Promise<void>;
    /** Callback trước khi mở popup để bind dữ liệu vào form detail. */
    bindingData?: (formState: FormState, recordData?: any) => void;
}

/**
 * Factory tạo composable dùng chung cho các màn hình detail.
 * @param options Cấu hình khởi tạo composable.
 * @returns Bộ state/hàm dùng chung cho luồng nhập liệu và lưu detail.
 */
export function useBaseDetail<TModel extends BaseModel>(options: BaseDetailOptions<TModel>) {
    /**
     * Các phần chính của useBaseDetail
     */
    const { api, formID, createDefaultData } = options;

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
    const formState = ref<FormState>(FormState.Add);

    /**
     * Trạng thái đang lưu dữ liệu, dùng để disable nút lưu và tránh gọi API nhiều lần khi người dùng click liên tục.
     */
    const saving = ref<boolean>(false);

    /**
     * Computed property xác định xem form đang ở chế độ Edit hay Add, dùng để điều chỉnh giao diện hoặc logic nếu cần thiết.
     */
    const isEditMode = computed<boolean>(() => formState.value === FormState.Edit);

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

    const beforeOpen = async ({ e, params }: any) => {
        try {
            formState.value = params?.FormState ?? FormState.Add;

            let recordData = params?.RecordData;

            if (params?.FormState === FormState.Edit && recordData) {
                const detailID = recordData[staticConfig.ModelKeyID ? staticConfig.ModelKeyID : "ID"];
                if (!detailID) {
                    throw new Error("Missing record ID for edit form");
                }

                const res = await api.getByID<TModel>(detailID);

                if (res.Success && res.Data) {
                    recordData = res.Data;
                }
            }

            Object.assign(model, buildModel(recordData));

            // options.bindingData?.(formState.value, recordData);
        } catch (error) {
            console.error("[ERROR] beforeOpen:", error);
        }
    };

    const createItem = () => {
        Object.assign(model, buildModel());
    };

    const editItem = async () => {
        try {
            let recordData = proxy._options;

            if (recordData) {
                const detailID = recordData[staticConfig.ModelKeyID ? staticConfig.ModelKeyID : "ID"];
                if (!detailID) {
                    throw new Error("Missing record ID for edit form");
                }

                const res = await api.getByID<TModel>(detailID);

                if (res.Success && res.Data) {
                    recordData = reactive(res.Data);
                }
            }

            Object.assign(model, buildModel(recordData));

            options.bindingData?.(formState.value, recordData);
        } catch (error) {
            console.error("[ERROR] beforeOpen:", error);
        }
    };

    // onMounted(() => {
    //     showDetail();
    // });

    const showDetail = () => {
        switch (formState.value) {
            case FormState.Add:
                createItem();
                break;
            case FormState.Edit:
                editItem();
                break;
        }
    };

    /**
     * Suy luận model state cho lần lưu hiện tại dựa trên formState.
     * @returns Giá trị Insert hoặc Update.
     */
    const getModelStateForSave = (): number => {
        return formState.value === FormState.Edit ? ModelState.Update : ModelState.Insert;
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

        if (modelState === ModelState.Insert) {
            model.ensurePrimaryKeyValue();
        }

        return {
            ...model,
            ...(transformedPayload ?? {}),
            ModelState: modelState,
        } as TModel & { ModelState: number };
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

        // Thực hiện custom validate nếu có
        const beforeSaveContext: BeforeSaveContext<TModel> = {
            model,
            formState: formState.value,
        };

        const customValidateResult = await options.customValidateBeforeSave?.(beforeSaveContext);
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
