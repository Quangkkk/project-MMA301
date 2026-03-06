import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import reactionService, { ReactionSummary } from '../services/reactionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReactionButtonProps {
  targetId: number;
  targetType: 'Post' | 'Comment';
  initialReactions?: number;
  initialUserReaction?: string;
  onLoginRequired?: () => void;
}

const REACTIONS = [
  { type: 'Like', icon: 'thumb-up', color: '#4267B2' },
  { type: 'Love', icon: 'heart', color: '#F33E58' },
  { type: 'Haha', icon: 'emoticon-happy', color: '#F7B125' },
  { type: 'Wow', icon: 'emoticon-excited', color: '#F7B125' },
  { type: 'Sad', icon: 'emoticon-sad', color: '#5890FF' },
  { type: 'Angry', icon: 'emoticon-angry', color: '#E9710F' }
];

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  targetId,
  targetType,
  initialReactions = 0,
  initialUserReaction,
  onLoginRequired
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [reactionSummary, setReactionSummary] = useState<ReactionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    loadReactionSummary();
  }, [targetId, targetType, token]);

  const loadToken = async () => {
    try {
      const userToken = await AsyncStorage.getItem('authToken');
      setToken(userToken);
      console.log('Token loaded:', userToken ? 'YES' : 'NO');
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const loadReactionSummary = async () => {
    try {
      const summary = await reactionService.getReactionSummary(
        targetId,
        targetType,
        token || undefined
      );
      setReactionSummary(summary);
      console.log('Reaction summary loaded:', JSON.stringify(summary, null, 2));
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK', style: 'default' }], { cancelable: true });
  };

  const handleReaction = async (reactionType: string) => {
    if (!token) {
      showAlert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập lại để thả reaction. Hãy thoát app và đăng nhập lại.');
      return;
    }

    setLoading(true);
    setShowPicker(false);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();

    try {
      await reactionService.addReaction(targetId, targetType, reactionType, token);
      await loadReactionSummary();
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      if (error.response?.data?.message === 'Reaction removed successfully') {
        await loadReactionSummary();
      }
    } finally {
      setLoading(false);
    }
  };

  const getTotalReactions = () => {
    if (!reactionSummary) return initialReactions;
    return reactionSummary.reactions.reduce((sum, r) => sum + r.count, 0);
  };

  const getUserReaction = () => {
    if (!reactionSummary?.userReaction) return null;
    return REACTIONS.find(r => r.type === reactionSummary.userReaction);
  };

  const getMostPopularReaction = () => {
    if (!reactionSummary || reactionSummary.reactions.length === 0) {
      return REACTIONS[0];
    }
    const sorted = [...reactionSummary.reactions].sort((a, b) => b.count - a.count);
    return REACTIONS.find(r => r.type === sorted[0].type) || REACTIONS[0];
  };

  const totalReactions = getTotalReactions();
  const userReaction = getUserReaction();
  const displayReaction = userReaction || getMostPopularReaction();

  console.log('ReactionButton render:', {
    targetId,
    hasToken: !!token,
    userReactionType: reactionSummary?.userReaction,
    userReactionObj: userReaction,
    displayColor: displayReaction.color
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.reactionButton,
          userReaction && { backgroundColor: displayReaction.color + '15' }
        ]}
        onPress={() => {
          if (userReaction) {
            handleReaction(reactionSummary?.userReaction || 'Like');
          } else {
            setShowPicker(true);
          }
        }}
        onLongPress={() => setShowPicker(true)}
        disabled={loading}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <MaterialCommunityIcons 
            name={displayReaction.icon as any} 
            size={18} 
            color={userReaction ? displayReaction.color : '#65676b'} 
          />
        </Animated.View>
        {totalReactions > 0 && (
          <Text style={[
            styles.reactionCount,
            userReaction && { color: displayReaction.color, fontWeight: '600' }
          ]}>
            {totalReactions}
          </Text>
        )}
      </TouchableOpacity>

      {showPicker && (
        <>
          <TouchableOpacity 
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
          <View style={styles.pickerContainer}>
            {REACTIONS.map((reaction) => (
              <TouchableOpacity
                key={reaction.type}
                style={[
                  styles.reactionOption,
                  userReaction?.type === reaction.type && { backgroundColor: reaction.color + '20' }
                ]}
                onPress={() => handleReaction(reaction.type)}
              >
                <MaterialCommunityIcons 
                  name={reaction.icon as any} 
                  size={22} 
                  color={reaction.color} 
                />
                <Text style={[styles.reactionOptionText, { color: reaction.color }]}>
                  {reaction.type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 5,
    minWidth: 50,
    justifyContent: 'center'
  },
  reactionCount: {
    fontSize: 12,
    color: '#65676b',
    fontWeight: '600'
  },
  pickerBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 998
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 40,
    left: -12,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 32,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    gap: 2,
    zIndex: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  reactionOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 24,
    minWidth: 52,
    minHeight: 60
  },
  reactionOptionText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3
  }
});

export default ReactionButton;
