import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    image: require('../assets/images/onboarding1.png'),
    title: 'Welcome to Study Buddy\nLearning Matching',
    description: 'Find study partners, share knowledge, and stay motivated with fellow QCU students.',
  },
  {
    id: 2,
    image: require('../assets/images/onboarding2.png'),
    title: 'Find Your Perfect Study\nPartner',
    description: 'Match with students based on your course, subjects, and study preferences.',
  },
  {
    id: 3,
    image: require('../assets/images/onboarding3.png'),
    title: 'Stay on Track',
    description: 'Manage your study sessions and stay updated with your learning goals.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      router.replace('/(profile)/profile-basic');
    }
  };

  const slide = slides[current];

  return (
    <View style={styles.container}>
      <Image source={slide.image} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === current && styles.activeDot]} />
            ))}
          </View>

          <View style={styles.buttons}>
            {current < slides.length - 1 ? (
              <>
                <TouchableOpacity onPress={() => router.replace('/(profile)/profile-basic')}>
                  <Text style={styles.skip}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextText}>→</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.getStartedBtn} onPress={handleNext}>
                <Text style={styles.getStartedText}>Get Started →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: width, height: height * 0.45, resizeMode: 'cover' },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 15 },
  description: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
  footer: { position: 'absolute', bottom: 40, left: 0, right: 0, paddingHorizontal: 30 },
  dots: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 20, gap: 6 },
  dot: { width: 20, height: 4, borderRadius: 2, backgroundColor: '#ccc' },
  activeDot: { width: 40, backgroundColor: '#1a6e8e' },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skip: { color: '#555', fontSize: 15 },
  nextBtn: { backgroundColor: '#1a6e8e', width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  nextText: { color: '#fff', fontSize: 20 },
  getStartedBtn: { backgroundColor: '#1a6e8e', borderRadius: 30, paddingVertical: 14, paddingHorizontal: 30, width: '100%', alignItems: 'center' },
  getStartedText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});