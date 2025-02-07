
export const getBase64ImageSize = (base64: string) => {
    // 去除Base64前缀（如：data:image/png;base64,）
    const base64Data = base64.split(',')[1]??base64;
    // 计算Base64字符串的长度
    const stringLength = base64Data.length;

    // 计算填充字符的数量
    const padding = (base64Data.match(/=/g) || []).length;

    // 计算原始数据大小（单位：字节）
    const fileSizeInBytes = (stringLength * 3) / 4 - padding;

    // 转换为KB或MB
    const fileSizeInKB = fileSizeInBytes / 1024;
    const fileSizeInMB = fileSizeInKB / 1024;

    return {
        bytes: fileSizeInBytes,
        kb: fileSizeInKB,
        mb: fileSizeInMB
    };
}