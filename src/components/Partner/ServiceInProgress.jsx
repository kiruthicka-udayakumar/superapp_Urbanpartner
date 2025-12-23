import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import partnerService from '../../services/partnerService';
import paymentServiceUI from '../../services/paymentService';
import Navbar from '../common/Navbar';
import bikeAnimation from '../../assets/bike_animation.mp4';


const ServiceInProgress = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const canvasRef = React.useRef(null);
    const videoRef = React.useRef(null);



    const paymentMethods = [
        { id: 'cod', name: 'Cash on Delivery', icon: 'M15 8.25V7.5a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25v.75m-3 0V15a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25V8.25m-12 0h12M12 11.25v.75m0 2.25v.75', color: '#22c55e' },
        { id: 'gpay', name: 'GPay (Google Pay)', icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3', color: '#4285F4' },
        { id: 'phonepay', name: 'PhonePe', icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3', color: '#6739b7' },
        { id: 'paytm', name: 'Paytm', icon: 'M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3', color: '#00baf2' },
        { id: 'amazonpay', name: 'Amazon Pay', icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z', color: '#ff9900' },
        { id: 'card', name: 'Credit/Debit Card', icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z', color: '#444' }
    ];

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let animationFrameId;

        const renderFrame = () => {
            if (video.paused || video.ended) return;
            if (canvas.width !== 320) { canvas.width = 320; canvas.height = 180; }

            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();

            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;
            const l = data.length / 4;

            for (let i = 0; i < l; i++) {
                let r = data[i * 4 + 0];
                let g = data[i * 4 + 1];
                let b = data[i * 4 + 2];

                if (g > 90 && g > r * 1.1 && g > b * 1.1) {
                    data[i * 4 + 3] = 0;
                    continue;
                }
                if (r > g * 1.4 && r > b * 1.4 && r > 50) {
                    data[i * 4 + 0] = 37;
                    data[i * 4 + 1] = g + 50;
                    if (data[i * 4 + 1] > 255) data[i * 4 + 1] = 255;
                    data[i * 4 + 2] = r;
                }
            }
            ctx.putImageData(frame, 0, 0);
            animationFrameId = requestAnimationFrame(renderFrame);
        };
        const onPlay = () => renderFrame();
        video.addEventListener('play', onPlay);
        if (video.readyState >= 2) video.play().catch(e => console.log("Video play failed", e));
        else video.oncanplay = () => video.play().catch(e => console.log("Video play failed", e));

        return () => {
            cancelAnimationFrame(animationFrameId);
            video.removeEventListener('play', onPlay);
        };
    }, []);



    useEffect(() => {
        const fetchAndCorrectBooking = async () => {
            try {
                const response = await partnerService.getBookingById(bookingId);
                const fetchedBooking = response.data;
                setBooking(fetchedBooking);

                if (fetchedBooking.status === 'on_the_way') {
                    await partnerService.updateBookingStatus(bookingId, 'in_progress');
                    setBooking(prev => ({ ...prev, status: 'in_progress' }));
                }
            } catch (err) {
                console.error('Error fetching/correcting booking:', err);
            }
        };
        fetchAndCorrectBooking();
    }, [bookingId]);

    const handleCompleteService = async (methodId) => {
        const paymentMethod = methodId || selectedPayment;

        if (!paymentMethod) {
            setShowPaymentModal(true);
            return;
        }

        try {
            setLoading(true);
            setShowPaymentModal(false);

            if (paymentMethod === 'cod') {
                await partnerService.updateBookingStatus(bookingId, 'completed', {
                    notes: `Payment received via CASH (recorded by partner)`
                });
                navigate('/dashboard');
            } else {
                // Determine display name for notes/history
                const methodObj = paymentMethods.find(m => m.id === paymentMethod);
                const methodName = methodObj ? methodObj.name : paymentMethod.toUpperCase();

                await paymentServiceUI.processPayment({
                    amount: booking?.pricing?.totalAmount || 0,
                    order_id: booking?._id,
                    customerName: booking?.customer?.name || 'Customer',
                    email: booking?.customer?.email || 'customer@citybell.com',
                    contact: booking?.customer?.phone || '9876543210',
                    description: `Service completion for ${booking?.title} via ${methodName}`
                }, {
                    onSuccess: async () => {
                        navigate('/dashboard');
                    },
                    onError: (err) => {
                        setError(err.message || 'Payment failed');
                        setLoading(false);
                    },
                    onCancel: () => {
                        setLoading(false);
                    }
                });
            }
        } catch (err) {
            console.error('Error completing service:', err);
            setError('Failed to complete service. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col antialiased">
            <Navbar />

            <div className="flex-grow flex flex-col items-center p-6 space-y-8 max-w-2xl mx-auto w-full">

                {/* Bike & Cogs Loop Animation */}
                <div className="relative w-full h-72 flex items-center justify-center overflow-hidden">
                    <div className="absolute animate-drive-pass flex items-center justify-center">
                        <video ref={videoRef} src={bikeAnimation} muted loop playsInline className="hidden" />
                        <canvas ref={canvasRef} className="w-48 h-32 object-contain drop-shadow-xl" />
                    </div>

                    <div className="absolute animate-cogs-pop flex flex-col items-center justify-center">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <svg width="0" height="0">
                                <defs>
                                    <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#dbeafe" />
                                        <stop offset="50%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#1e40af" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Top Left - Large Cog */}
                            <div className="absolute top-12 left-12 animate-spin" style={{ animationDuration: '8s' }}>
                                <svg width="84" height="84" viewBox="0 0 100 100">
                                    <path fill="url(#metalGradient)" d="M50 0 L58 10 L70 5 L75 18 L88 15 L88 28 L98 32 L92 42 L100 50 L92 58 L98 68 L88 72 L88 85 L75 82 L70 95 L58 90 L50 100 L42 90 L30 95 L25 82 L12 85 L12 72 L2 68 L8 58 L0 50 L8 42 L2 32 L12 28 L12 15 L25 18 L30 5 L42 10 Z" />
                                    <circle cx="50" cy="50" r="15" fill="#fff" />
                                </svg>
                            </div>

                            {/* Center - Smaller Cog (Interconnected) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
                                <svg width="44" height="44" viewBox="0 0 100 100">
                                    <path fill="url(#metalGradient)" d="M50 0 L58 10 L70 5 L75 18 L88 15 L88 28 L98 32 L92 42 L100 50 L92 58 L98 68 L88 72 L88 85 L75 82 L70 95 L58 90 L50 100 L42 90 L30 95 L25 82 L12 85 L12 72 L2 68 L8 58 L0 50 L8 42 L2 32 L12 28 L12 15 L25 18 L30 5 L42 10 Z" />
                                    <circle cx="50" cy="50" r="12" fill="#fff" />
                                </svg>
                            </div>

                            {/* Bottom Right - Large Cog */}
                            <div className="absolute bottom-12 right-12 animate-spin" style={{ animationDuration: '8s' }}>
                                <svg width="96" height="96" viewBox="0 0 100 100">
                                    <path fill="url(#metalGradient)" d="M50 0 L58 10 L70 5 L75 18 L88 15 L88 28 L98 32 L92 42 L100 50 L92 58 L98 68 L88 72 L88 85 L75 82 L70 95 L58 90 L50 100 L42 90 L30 95 L25 82 L12 85 L12 72 L2 68 L8 58 L0 50 L8 42 L2 32 L12 28 L12 15 L25 18 L30 5 L42 10 Z" />
                                    <circle cx="50" cy="50" r="18" fill="#fff" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-blue-500 font-black text-sm uppercase tracking-[0.2em] animate-pulse -mt-4">Processing...</p>
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Service in Progress</h2>
                    <p className="text-gray-500 font-medium">Please complete the service requested by the customer.</p>
                </div>

                {/* Animated Loading Bar */}
                <div className="w-full max-w-md space-y-3">
                    <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                        <span>Started</span>
                        <span className="text-blue-600">Servicing</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
                        <div className="absolute top-0 left-0 w-full h-full bg-blue-600 animate-wave rounded-full"></div>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">In Progress...</p>
                </div>

                {error && (
                    <div className="w-full max-w-md p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                        {error}
                    </div>
                )}

                {/* Payment Interaction Area */}
                <div className="w-full max-w-md space-y-4">
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={loading}
                        className={`w-full flex items-center justify-center py-5 rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-2xl transition-all transform active:scale-95 ${loading
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Updating...</span>
                            </div>
                        ) : (
                            'Mark Service As Completed'
                        )}
                    </button>

                    <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
                        Collect payment to finish order
                    </p>
                </div>

            </div>

            {/* Payment Selection Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4">
                    <div
                        className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden animate-slide-up shadow-2xl flex flex-col"
                        style={{ maxHeight: '90vh' }}
                    >
                        {/* Modal Header */}
                        <div className="p-8 pb-4 text-center relative">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Receive Payment</h3>
                            <p className="text-gray-500 font-bold text-sm mt-2 uppercase tracking-widest opacity-60">Selection Required</p>

                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body - Payment Options */}
                        <div className="p-6 pt-2 space-y-3 overflow-y-auto">
                            {paymentMethods
                                .filter(m => ['cod', 'paytm', 'phonepay', 'gpay', 'amazonpay'].includes(m.id))
                                .map((method) => (
                                    <button
                                        key={method.id}
                                        disabled={loading}
                                        onClick={() => handleCompleteService(method.id)}
                                        className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border-2 border-gray-50 bg-gray-50 hover:border-blue-600 hover:bg-blue-50/50 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                                                style={{ backgroundColor: method.color }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={method.icon} />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-black text-gray-900 text-lg uppercase tracking-tight leading-none mb-1">{method.name}</span>
                                                <span className="block text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">Instant Confirmation</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center group-hover:border-blue-500 transition-colors shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-0.5 transition-all">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </div>
                                    </button>
                                ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 pt-0 mt-2">
                            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] px-8">
                                By completing, you confirm that you have received the total amount from the customer.
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ServiceInProgress;
