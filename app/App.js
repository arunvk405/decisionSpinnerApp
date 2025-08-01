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

const { width, height } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width * 0.6, height * 0.3);
const CENTER_X = WHEEL_SIZE / 2;
const CENTER_Y = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2;

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

// Generic Decision Wheel Component
const DecisionWheel = React.memo(function DecisionWheel({ options, rotationValue }) {
    const [wheelSize, setWheelSize] = useState(WHEEL_SIZE);
    const [centerX, setCenterX] = useState(CENTER_X);
    const [centerY, setCenterY] = useState(CENTER_Y);
    const [radius, setRadius] = useState(RADIUS);

    // Update dimensions on window resize for web compatibility
    useEffect(() => {
        const handleResize = () => {
            const newWidth = Dimensions.get('window').width;
            const newHeight = Dimensions.get('window').height;
            const newSize = Math.min(newWidth * 0.6, newHeight * 0.3);
            setWheelSize(newSize);
            setCenterX(newSize / 2);
            setCenterY(newSize / 2);
            setRadius(newSize / 2);
        };

        handleResize(); // Initial call
        Dimensions.addEventListener('change', handleResize);

        return () => {
            Dimensions.removeEventListener('change', handleResize);
        };
    }, []);

    const segmentAngle = options.length > 0 ? 360 / options.length : 0;
    const colors = [
        '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
        '#E77B7C', '#D65076', '#45B8AC', '#C6B49D', '#ADADAD'
    ];

    return (
        <Animated.View
            style={[
                styles.wheelContainer,
                {
                    width: wheelSize,
                    height: wheelSize,
                    transform: [{
                        rotate: rotationValue.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                        })
                    }],
                },
            ]}
        >
            <Svg height={wheelSize} width={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
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

                        return (
                            <G key={option.id}>
                                <Path d={pathData} fill={fillColor} stroke="#FFF" strokeWidth="2" />
                                <SvgText
                                    x={textPos.x}
                                    y={textPos.y}
                                    fill="#FFFFFF"
                                    fontSize="12"
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

// Custom Alert Modal Component (remains the same)
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

// Styles for the Custom Alert Modal (remains the same)
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
        { id: '3', 'name': 'Watch a movie' },
        { id: '4', name: 'Play a game' },
        { id: '5', name: 'Work on a hobby' },
    ]);
    const [newItem, setNewItem] = useState('');
    const spinValue = useRef(new Animated.Value(0)).current;

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalOnConfirm, setModalOnConfirm] = useState(() => () => setModalVisible(false));
    const [modalOnCancel, setModalOnCancel] = useState(() => () => setModalVisible(false));
    const [showModalCancelButton, setShowModalCancelButton] = useState(false);

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

        // NEW LOGIC TO CORRECTLY ALIGN THE ARROW
        const targetCenterAngle = (randomIndex * segmentAngle) + (segmentAngle / 2);
        const numFullSpins = 5;
        
        // This is the key fix: we need to subtract the initial -90 degree offset.
        // A full rotation is 360 degrees. To align the `targetCenterAngle` (which is relative to the SVG's 0-degree point)
        // with the arrow (which is at the top), we need to rotate the wheel by `360 - (targetCenterAngle + 90)`.
        // The +90 accounts for the SVG text rotation.
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

    return (
        <View style={styles.container}>
            {/* Custom Alert Modal */}
            <CustomAlertModal
                isVisible={modalVisible}
                title={modalTitle}
                message={modalMessage}
                onConfirm={modalOnConfirm}
                onCancel={modalOnCancel}
                showCancelButton={showModalCancelButton}
            />

            {/* UPDATED HEADER TEXT */}
            <Text style={styles.header}>{`Confused? Let's make a decision together!`}</Text>

            <View style={styles.topSection}>
                <View style={styles.wheelWrapper}>
                    <DecisionWheel
                        options={options}
                        rotationValue={spinValue}
                    />
                    <View style={styles.arrowContainer}>
                        <View style={styles.arrow} />
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.spinButton} onPress={spinWheel}>
                <Text style={styles.buttonText}>SPIN</Text>
            </TouchableOpacity>

            <View style={styles.inputSection}>
                <TextInput
                    style={styles.input}
                    placeholder="Type Options"
                    value={newItem}
                    onChangeText={setNewItem}
                    onSubmitEditing={addItem}
                />
                <TouchableOpacity style={styles.submitButton} onPress={addItem}>
                    <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
                {options.length === 0 ? (
                    <Text style={styles.noOptionsText}>No options added yet. Type some above!</Text>
                ) : (
                    options.map((optionItem) => (
                        <View key={optionItem.id} style={styles.optionItem}>
                            <Text style={styles.optionItemText}>{optionItem.name}</Text>
                            <TouchableOpacity onPress={() => removeItem(optionItem.id)} style={styles.removeButtonTouch}>
                                <Text style={styles.removeButton}>x</Text>
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
        paddingTop: 40,
        // Added to ensure proper layout in web extension
        width: '100%',
        height: '100%',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
        paddingHorizontal: 15,
    },
    topSection: {
        width: '100%',
        // Use a more predictable height for web
        // height: '40%',
        minHeight: 250, // Added min-height for stable sizing
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelWrapper: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelContainer: {
        // Updated to use dynamic sizing from state
        borderRadius: RADIUS,
        overflow: 'hidden',
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
    },
    arrowContainer: {
        position: 'relative',
        // top: '100%',
        left: '7%',
        transform: [{ translateX: -15 }],
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        borderBottomWidth: 30,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FF6347',
        zIndex: 1,
    },
    arrow: {},
    spinButton: {
        backgroundColor: '#FF6347',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    inputSection: {
        flexDirection: 'row',
        marginBottom: 20,
        width: '90%',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D9E6',
        padding: 12,
        borderRadius: 10,
        marginRight: 10,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    submitButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    optionsList: {
        width: '90%',
        flex: 1,
        borderWidth: 1,
        borderColor: '#E6EBF5',
        borderRadius: 10,
        backgroundColor: 'white',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F3F9',
    },
    optionItemText: {
        fontSize: 16,
        color: '#333',
        flexShrink: 1,
        marginRight: 10,
    },
    removeButtonTouch: {
        padding: 5,
    },
    removeButton: {
        color: 'red',
        fontSize: 18,
        fontWeight: 'bold',
    },
    noOptionsText: {
        textAlign: 'center',
        padding: 20,
        color: '#888',
        fontSize: 16,
    }
});

export default DecisionSpinnerApp;