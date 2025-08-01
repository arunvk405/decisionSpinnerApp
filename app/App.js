import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { G, Path, Text as SvgText, TSpan } from 'react-native-svg';

// Helper functions for SVG
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians)),
    };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    const d = [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        'L', x, y,
        'Z',
    ].join(' ');

    return d;
};

// Responsive wheel size calculation
const getWheelDimensions = () => {
    const { width, height } = Dimensions.get('window');
    
    // Fallback values if dimensions are not available
    if (!width || !height || width <= 0 || height <= 0) {
        return {
            wheelSize: 250,
            centerX: 125,
            centerY: 125,
            radius: 125,
        };
    }

    const isLandscape = width > height;
    const isTablet = Math.min(width, height) > 600;
    const isDesktop = Math.min(width, height) > 1024;

    let wheelSize;
    if (isDesktop) {
        wheelSize = Math.min(width * 0.3, height * 0.4, 400);
    } else if (isTablet) {
        wheelSize = Math.min(width * 0.4, height * 0.35, 350);
    } else if (isLandscape) {
        wheelSize = Math.min(width * 0.35, height * 0.6, 280);
    } else {
        wheelSize = Math.min(width * 0.75, height * 0.35, 300);
    }

    // Ensure minimum size
    wheelSize = Math.max(wheelSize, 200);

    return {
        wheelSize,
        centerX: wheelSize / 2,
        centerY: wheelSize / 2,
        radius: wheelSize / 2,
    };
};

// Generic Decision Wheel Component
const DecisionWheel = React.memo(function DecisionWheel({ options, rotationValue }) {
    const [dimensions, setDimensions] = useState(() => getWheelDimensions());
    const [isInitialized, setIsInitialized] = useState(false);

    // Force initialization and handle resize
    useEffect(() => {
        // Force immediate dimension calculation
        const initialDimensions = getWheelDimensions();
        setDimensions(initialDimensions);
        
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            setIsInitialized(true);
            setDimensions(getWheelDimensions());
        }, 100);

        const handleResize = () => {
            setDimensions(getWheelDimensions());
        };

        const subscription = Dimensions.addEventListener('change', handleResize);
        
        return () => {
            clearTimeout(timer);
            subscription?.remove();
        };
    }, []);

    const { wheelSize, centerX, centerY, radius } = dimensions;
    const segmentAngle = options.length > 0 ? 360 / options.length : 0;
    const colors = [
        '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
        '#E77B7C', '#D65076', '#45B8AC', '#C6B49D', '#ADADAD'
    ];

    // Don't render until initialized to prevent layout issues
    if (!isInitialized || wheelSize <= 0) {
        return (
            <View style={[styles.wheelContainer, { 
                width: 250, 
                height: 250, 
                borderRadius: 125,
                backgroundColor: '#f0f0f0',
                justifyContent: 'center',
                alignItems: 'center'
            }]}>
                <Text style={{ color: '#666', fontSize: 16 }}>Loading...</Text>
            </View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.wheelContainer,
                {
                    width: wheelSize,
                    height: wheelSize,
                    borderRadius: radius,
                    transform: [{
                        rotate: rotationValue.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                        })
                    }],
                },
            ]}
        >
            <Svg 
                height={wheelSize} 
                width={wheelSize} 
                viewBox={`0 0 ${wheelSize} ${wheelSize}`}
                style={{ width: wheelSize, height: wheelSize }}
            >
                <G origin={`${centerX}, ${centerY}`} rotation={-90}>
                    {options.map((option, index) => {
                        const startAngle = index * segmentAngle;
                        const endAngle = (index + 1) * segmentAngle;
                        const pathData = describeArc(centerX, centerY, radius, startAngle, endAngle);
                        const fillColor = colors[index % colors.length];

                        const textRadius = radius * 0.6;
                        const textAngle = startAngle + (segmentAngle / 2);
                        const textPos = polarToCartesian(centerX, centerY, textRadius, textAngle);
                        const textRotation = textAngle + 90;

                        // Responsive font size based on wheel size
                        const fontSize = Math.max(10, wheelSize / 25);

                        return (
                            <G key={option.id}>
                                <Path d={pathData} fill={fillColor} stroke="#FFF" strokeWidth="2" />
                                <SvgText
                                    x={textPos.x}
                                    y={textPos.y}
                                    fill="#FFFFFF"
                                    fontSize={fontSize}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    transform={`rotate(${textRotation}, ${textPos.x}, ${textPos.y})`}
                                >
                                    <TSpan>{option.name}</TSpan>
                                </SvgText>
                            </G>
                        );
                    })}
                </G>
            </Svg>
        </Animated.View>
    );
});

// Custom Alert Modal Component
const CustomAlertModal = ({ isVisible, title, message, onConfirm, onCancel, showCancelButton = false }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={showCancelButton ? onCancel : onConfirm}
        >
            <View style={modalStyles.centeredView}>
                <View style={modalStyles.modalView}>
                    <Text style={modalStyles.modalTitle}>{title}</Text>
                    <Text style={modalStyles.modalMessage}>{message}</Text>
                    <View style={modalStyles.buttonContainer}>
                        {showCancelButton && (
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.buttonCancel]}
                                onPress={onCancel}
                            >
                                <Text style={modalStyles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.buttonConfirm]}
                            onPress={onConfirm}
                        >
                            <Text style={modalStyles.textStyle}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Styles for the Custom Alert Modal
const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalMessage: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        minWidth: 90,
        alignItems: 'center',
    },
    buttonConfirm: {
        backgroundColor: '#2196F3',
    },
    buttonCancel: {
        backgroundColor: '#f44336',
        marginRight: 10,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

const DecisionSpinnerApp = () => {
    const [options, setOptions] = useState([
        { id: '1', name: 'Go for a walk' },
        { id: '2', name: 'Read a book' },
        { id: '3', name: 'Watch a movie' },
        { id: '4', name: 'Play a game' },
        { id: '5', name: 'Work on a hobby' },
    ]);
    const [newItem, setNewItem] = useState('');
    const [screenData, setScreenData] = useState(() => Dimensions.get('window'));
    const [isAppReady, setIsAppReady] = useState(false);
    const spinValue = useRef(new Animated.Value(0)).current;

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalOnConfirm, setModalOnConfirm] = useState(() => () => setModalVisible(false));
    const [modalOnCancel, setModalOnCancel] = useState(() => () => setModalVisible(false));
    const [showModalCancelButton, setShowModalCancelButton] = useState(false);

    // Initialize app and update screen dimensions
    useEffect(() => {
        // Force initial screen data update
        const initialScreenData = Dimensions.get('window');
        setScreenData(initialScreenData);
        
        // Mark app as ready after a short delay to ensure proper initialization
        const initTimer = setTimeout(() => {
            setIsAppReady(true);
        }, 150);

        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenData(window);
        });
        
        return () => {
            clearTimeout(initTimer);
            subscription?.remove();
        };
    }, []);

    const showCustomAlert = (title, message, onConfirmCallback = () => { }, onCancelCallback = () => { }, showCancel = false) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalOnConfirm(() => {
            const func = () => {
                onConfirmCallback();
                setModalVisible(false);
            };
            return func;
        });
        setModalOnCancel(() => {
            const func = () => {
                onCancelCallback();
                setModalVisible(false);
            };
            return func;
        });
        setShowModalCancelButton(showCancel);
        setModalVisible(true);
    };

    const addItem = () => {
        const trimmedItem = newItem.trim();
        if (trimmedItem) {
            if (options.some(item => item.name.toLowerCase() === trimmedItem.toLowerCase())) {
                showCustomAlert("Duplicate Option", `'${trimmedItem}' is already in the list!`);
                return;
            }
            const newId = Date.now().toString();
            setOptions([...options, { id: newId, name: trimmedItem }]);
            setNewItem('');
        } else {
            showCustomAlert("Input Required", "Please type an option before submitting.");
        }
    };

    const removeItem = (idToRemove) => {
        setOptions(options.filter(item => item.id !== idToRemove));
    };

    const spinWheel = () => {
        if (options.length === 0) {
            showCustomAlert("No Options", "Please add some options first!");
            return;
        }

        spinValue.stopAnimation();
        spinValue.setValue(0);

        const randomIndex = Math.floor(Math.random() * options.length);
        const selectedItem = options[randomIndex].name;
        const segmentAngle = 360 / options.length;

        const targetCenterAngle = (randomIndex * segmentAngle) + (segmentAngle / 2);
        const numFullSpins = 5;
        const finalRotation = (numFullSpins * 360) + (360 - (targetCenterAngle + 90) % 360);

        Animated.timing(spinValue, {
            toValue: finalRotation,
            duration: 4000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start(() => {
            showCustomAlert("Your Decision!", `How about: ${selectedItem}?`);
        });
    };

    // Responsive styling
    const isLandscape = screenData.width > screenData.height;
    const isTablet = Math.min(screenData.width, screenData.height) > 600;
    const isDesktop = Math.min(screenData.width, screenData.height) > 1024;

    // Show loading state until app is ready
    if (!isAppReady) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <Text style={[styles.header, { marginBottom: 20 }]}>
                    Decision Spinner
                </Text>
                <View style={{
                    width: 250,
                    height: 250,
                    borderRadius: 125,
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 20
                }}>
                    <Text style={{ color: '#666', fontSize: 16 }}>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isLandscape && styles.containerLandscape]}>
            {/* Custom Alert Modal */}
            <CustomAlertModal
                isVisible={modalVisible}
                title={modalTitle}
                message={modalMessage}
                onConfirm={modalOnConfirm}
                onCancel={modalOnCancel}
                showCancelButton={showModalCancelButton}
            />

            <Text style={[
                styles.header,
                isTablet && styles.headerTablet,
                isDesktop && styles.headerDesktop
            ]}>
                {`Confused? Let's make a decision together!`}
            </Text>

            <View style={[
                styles.topSection,
                isLandscape && styles.topSectionLandscape,
                isTablet && styles.topSectionTablet
            ]}>
                <View style={styles.wheelWrapper}>
                    <DecisionWheel
                        options={options}
                        rotationValue={spinValue}
                    />
                    {/* Arrow positioned at the bottom of the wheel */}
                    <View style={styles.arrowContainer}>
                        <View style={[
                            styles.arrow,
                            isTablet && styles.arrowTablet,
                            isDesktop && styles.arrowDesktop
                        ]} />
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.spinButton,
                    isTablet && styles.spinButtonTablet,
                    isDesktop && styles.spinButtonDesktop
                ]}
                onPress={spinWheel}
            >
                <Text style={[
                    styles.buttonText,
                    isTablet && styles.buttonTextTablet,
                    isDesktop && styles.buttonTextDesktop
                ]}>SPIN</Text>
            </TouchableOpacity>

            <View style={[
                styles.inputSection,
                isLandscape && styles.inputSectionLandscape,
                isTablet && styles.inputSectionTablet,
                isDesktop && styles.inputSectionDesktop
            ]}>
                <TextInput
                    style={[
                        styles.input,
                        isTablet && styles.inputTablet,
                        isDesktop && styles.inputDesktop
                    ]}
                    placeholder="Type Options"
                    value={newItem}
                    onChangeText={setNewItem}
                    onSubmitEditing={addItem}
                />
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        isTablet && styles.submitButtonTablet,
                        isDesktop && styles.submitButtonDesktop
                    ]}
                    onPress={addItem}
                >
                    <Text style={[
                        styles.buttonText,
                        isTablet && styles.buttonTextTablet,
                        isDesktop && styles.buttonTextDesktop
                    ]}>Submit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={[
                styles.optionsList,
                isLandscape && styles.optionsListLandscape,
                isTablet && styles.optionsListTablet,
                isDesktop && styles.optionsListDesktop
            ]}>
                {options.length === 0 ? (
                    <Text style={[
                        styles.noOptionsText,
                        isTablet && styles.noOptionsTextTablet,
                        isDesktop && styles.noOptionsTextDesktop
                    ]}>
                        No options added yet. Type some above!
                    </Text>
                ) : (
                    options.map((optionItem) => (
                        <View key={optionItem.id} style={[
                            styles.optionItem,
                            isTablet && styles.optionItemTablet,
                            isDesktop && styles.optionItemDesktop
                        ]}>
                            <Text style={[
                                styles.optionItemText,
                                isTablet && styles.optionItemTextTablet,
                                isDesktop && styles.optionItemTextDesktop
                            ]}>
                                {optionItem.name}
                            </Text>
                            <TouchableOpacity
                                onPress={() => removeItem(optionItem.id)}
                                style={styles.removeButtonTouch}
                            >
                                <Text style={[
                                    styles.removeButton,
                                    isTablet && styles.removeButtonTablet,
                                    isDesktop && styles.removeButtonDesktop
                                ]}>×</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
        paddingTop: 20,
        paddingHorizontal: 10,
        width: '100%',
        height: '100%',
    },
    containerLandscape: {
        paddingTop: 10,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
        textAlign: 'center',
        paddingHorizontal: 15,
    },
    headerTablet: {
        fontSize: 28,
        marginBottom: 20,
    },
    headerDesktop: {
        fontSize: 32,
        marginBottom: 25,
    },
    topSection: {
        width: '100%',
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    topSectionLandscape: {
        minHeight: 180,
        marginBottom: 10,
    },
    topSectionTablet: {
        minHeight: 280,
        marginBottom: 20,
    },
    wheelWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    wheelContainer: {
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
    },
    arrowContainer: {
        position: 'absolute',
        bottom: -15,
        left: '50%',
        transform: [{ translateX: -12 }],
        zIndex: 10,
    },
    arrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderBottomWidth: 30,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FF6347',
    },
    arrowTablet: {
        borderLeftWidth: 15,
        borderRightWidth: 15,
        borderBottomWidth: 35,
    },
    arrowDesktop: {
        borderLeftWidth: 18,
        borderRightWidth: 18,
        borderBottomWidth: 40,
    },
    spinButton: {
        backgroundColor: '#FF6347',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    spinButtonTablet: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginBottom: 25,
    },
    spinButtonDesktop: {
        paddingVertical: 18,
        paddingHorizontal: 50,
        borderRadius: 35,
        marginBottom: 30,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    buttonTextTablet: {
        fontSize: 20,
    },
    buttonTextDesktop: {
        fontSize: 22,
    },
    inputSection: {
        flexDirection: 'row',
        marginBottom: 15,
        width: '95%',
        maxWidth: 500,
        justifyContent: 'center',
    },
    inputSectionLandscape: {
        width: '70%',
        marginBottom: 10,
    },
    inputSectionTablet: {
        width: '80%',
        maxWidth: 600,
        marginBottom: 20,
    },
    inputSectionDesktop: {
        width: '60%',
        maxWidth: 700,
        marginBottom: 25,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D9E6',
        padding: 10,
        borderRadius: 8,
        marginRight: 8,
        fontSize: 14,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    inputTablet: {
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        marginRight: 10,
    },
    inputDesktop: {
        padding: 14,
        borderRadius: 12,
        fontSize: 18,
        marginRight: 12,
    },
    submitButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    submitButtonTablet: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    submitButtonDesktop: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    optionsList: {
        width: '95%',
        maxWidth: 500,
        flex: 1,
        borderWidth: 1,
        borderColor: '#E6EBF5',
        borderRadius: 8,
        backgroundColor: 'white',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    optionsListLandscape: {
        width: '70%',
    },
    optionsListTablet: {
        width: '80%',
        maxWidth: 600,
        borderRadius: 10,
        marginBottom: 20,
    },
    optionsListDesktop: {
        width: '60%',
        maxWidth: 700,
        borderRadius: 12,
        marginBottom: 25,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F3F9',
    },
    optionItemTablet: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    optionItemDesktop: {
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    optionItemText: {
        fontSize: 14,
        color: '#333',
        flexShrink: 1,
        marginRight: 8,
    },
    optionItemTextTablet: {
        fontSize: 16,
        marginRight: 10,
    },
    optionItemTextDesktop: {
        fontSize: 18,
        marginRight: 12,
    },
    removeButtonTouch: {
        padding: 4,
    },
    removeButton: {
        color: 'red',
        fontSize: 16,
        fontWeight: 'bold',
    },
    removeButtonTablet: {
        fontSize: 18,
    },
    removeButtonDesktop: {
        fontSize: 20,
    },
    noOptionsText: {
        textAlign: 'center',
        padding: 15,
        color: '#888',
        fontSize: 14,
    },
    noOptionsTextTablet: {
        padding: 20,
        fontSize: 16,
    },
    noOptionsTextDesktop: {
        padding: 25,
        fontSize: 18,
    },
});

export default DecisionSpinnerApp;