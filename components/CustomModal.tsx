import React, { PropsWithChildren } from 'react'
import { Modal, Pressable } from 'react-native'

interface ICustomModalProps {
    visible: boolean
    onClose: () => void
}

function CustomModal({ visible, children, onClose }: PropsWithChildren<ICustomModalProps>) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable className="absolute inset-0 flex-1 items-center justify-center bg-black" onPress={onClose}>
                {/* 下面这个View包裹内容，阻止事件冒泡 */}
                <Pressable onPress={() => {}}>{children}</Pressable>
            </Pressable>
        </Modal>
    )
}

export default CustomModal
