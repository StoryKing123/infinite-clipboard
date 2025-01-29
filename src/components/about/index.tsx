export const About = () => {
    return (
        <div>
            <div className="flex flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-bold mb-4">关于剪贴板</h1>
                
                <div className="max-w-2xl text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        这是一个跨平台的剪贴板管理工具,可以帮助你管理和同步剪贴板内容。
                    </p>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h2 className="text-lg font-semibold mb-2">主要功能</h2>
                        <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                            <li>• 自动保存剪贴板历史</li>
                            <li>• 支持多设备同步</li>
                            <li>• 支持暗黑模式</li>
                            <li>• GitHub账号登录</li>
                        </ul>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h2 className="text-lg font-semibold mb-2">版本信息</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            当前版本: v1.0.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
