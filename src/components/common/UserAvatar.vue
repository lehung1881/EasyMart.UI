<template>
    <div :class="['user-avatar flex-shrink-0', shapeClass]" :style="sizeStyle">
        <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="fullName"
            :class="['w-full h-full object-cover', shapeClass]"
        />
        <div
            v-else
            :class="['w-full h-full flex items-center justify-center font-semibold text-white', shapeClass]"
            :style="{ backgroundColor: avatarColor, fontSize: fontSizeStyle }"
        >
            {{ avatarInitials }}
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from "vue";

export default defineComponent({
    name: "UserAvatar",
    props: {
        fullName: {
            type: String,
            default: "",
        },
        avatarUrl: {
            type: String,
            default: "",
        },
        // Hỗ trợ truyền số (px) hoặc chuỗi (ví dụ: '36px', '2rem', hoặc các class size nếu muốn)
        size: {
            type: [Number, String],
            default: 36, // Mặc định là 36px tương đương w-9 h-9 cũ
        },
        // Kiểu hình dạng: 'circle' (tròn) hoặc 'square' (vuông) hoặc 'rounded' (bo góc nhẹ)
        shape: {
            type: String as PropType<"circle" | "square" | "rounded">,
            default: "circle",
        },
    },
    setup(props) {
        /**
         * Tính toán class dựa trên hình dạng mong muốn
         */
        const shapeClass = computed(() => {
            if (props.shape === "circle") return "rounded-full";
            if (props.shape === "rounded") return "rounded-md";
            return "rounded-none"; // square
        });

        /**
         * Tính toán style kích thước width/height linh hoạt
         */
        const sizeStyle = computed(() => {
            const sizeVal = typeof props.size === "number" ? `${props.size}px` : props.size;
            return {
                width: sizeVal,
                height: sizeVal,
            };
        });

        /**
         * Tự động điều chỉnh kích cỡ chữ (font-size) tỉ lệ thuận theo size của avatar
         */
        const fontSizeStyle = computed(() => {
            if (typeof props.size === "number") {
                return `${Math.max(12, Math.floor(props.size * 0.38))}px`;
            }
            return "0.875rem"; // Fallback text-sm
        });

        /**
         * Lấy chữ viết tắt từ họ tên (fallback)
         */
        const avatarInitials = computed(() => {
            if (!props.fullName) return "?";
            const words = props.fullName.trim().split(/\s+/);
            if (words.length === 1) return words[0]![0]!.toUpperCase();
            return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
        });

        /**
         * Sinh màu nền ngẫu nhiên theo tên nhưng cố định
         */
        const avatarColor = computed(() => {
            const colorPalette = [
                "#E8724A", "#4F86C6", "#5BAD8F", "#E05B8A", 
                "#9B6BB5", "#7B8FA1", "#4AAFB8", "#D4A843"
            ];
            if (!props.fullName) return colorPalette[0]!;
            const hashCode = [...props.fullName].reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return colorPalette[hashCode % colorPalette.length]!;
        });

        return {
            shapeClass,
            sizeStyle,
            fontSizeStyle,
            avatarInitials,
            avatarColor,
        };
    },
});
</script>