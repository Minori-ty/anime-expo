import React, { useEffect, useRef } from 'react'

export const useUpdateEffect = (effect: () => void, dependencies: React.DependencyList) => {
    const isFirstMount = useRef(true)

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false
            return
        }
        return effect()
    }, dependencies)
}
