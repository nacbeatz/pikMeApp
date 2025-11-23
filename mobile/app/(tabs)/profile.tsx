import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getMyMatches, getMyPickRequests, type Match, type PickRequest } from '@/services/api';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [myPickRequests, setMyPickRequests] = useState<PickRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const [matchesData, pickRequestsData] = await Promise.all([
        getMyMatches().catch(() => [] as Match[]),
        getMyPickRequests().catch(() => [] as PickRequest[]),
      ]);
      
      console.log('Profile data loaded:', {
        matchesCount: matchesData.length,
        matches: matchesData,
        pickRequestsCount: pickRequestsData.length,
      });
      
      setMatches(matchesData);
      setMyPickRequests(pickRequestsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleStartTracking = async (match: Match) => {
    // Get pick request details to get coordinates for tracking
    try {
      // Get all pick requests to find the one for this match
      const pickRequests = await getMyPickRequests();
      const matchedRequest = pickRequests.find(pr => pr.pickRequestId === match.pickRequestId);
      
      if (matchedRequest) {
        // Navigate to map with match and location details for live tracking
        router.push({
          pathname: '/(tabs)/map',
          params: {
            trackMatch: match.matchId.toString(),
            requesterLat: matchedRequest.latitude.toString(),
            requesterLng: matchedRequest.longitude.toString(),
            pickerName: match.pickerName,
            requesterName: match.requesterName,
            pickerId: match.pickerId.toString(),
            requesterId: match.requesterId.toString(),
          },
        });
      } else {
        Alert.alert('Error', 'Could not find pick request details for tracking.');
      }
    } catch (error) {
      console.error('Error getting pick request for tracking:', error);
      Alert.alert('Error', 'Failed to load tracking details. Please try again.');
    }
  };

  // Filter approved/accepted matches
  const approvedMatches = matches.filter((m) => m.status === 'ACCEPTED');
  const pendingMatches = matches.filter((m) => m.status === 'PENDING');
  
  console.log('Matches filtering:', {
    totalMatches: matches.length,
    approvedMatches: approvedMatches.length,
    pendingMatches: pendingMatches.length,
    allMatchStatuses: matches.map(m => ({ id: m.matchId, status: m.status, pickerName: m.pickerName, requesterName: m.requesterName })),
  });

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.placeholder}>Please login to view your profile</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth')}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5213FE" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5213FE" />}>
      <View style={styles.header}>
        
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.title}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* User Account Info */}
      <View style={styles.section}>
        <View style={styles.accountCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
      </View>

      {/* My Pick Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Pick Requests</Text>
        {myPickRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="info-outline" size={32} color="#A0A0A0" />
            <Text style={styles.emptyText}>No pick requests yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/add-activity')}>
              <Text style={styles.createButtonText}>Create Pick Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {myPickRequests.map((request) => (
              <View key={request.pickRequestId} style={styles.requestCard}>
                <Text style={styles.requestActivity}>{request.activityType}</Text>
                <Text style={styles.requestStatus}>{request.status}</Text>
                {request.subject && <Text style={styles.requestSubject}>{request.subject}</Text>}
                <Text style={styles.requestDuration}>{request.durationMinutes} min</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Matches</Text>
          {pendingMatches.map((match) => (
            <View key={match.matchId} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <MaterialIcons name="schedule" size={20} color="#FFA500" />
                <Text style={styles.matchStatus}>PENDING</Text>
              </View>
              <Text style={styles.matchInfo}>
                {match.pickerId === user?.userId
                  ? `You picked ${match.requesterName || 'Unknown'}`
                  : `${match.pickerName || 'Someone'} wants to pick you`}
              </Text>
              <Text style={styles.matchDate}>
                {new Date(match.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Approved/Matched Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Approved Matches</Text>
        {approvedMatches.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="check-circle-outline" size={32} color="#A0A0A0" />
            <Text style={styles.emptyText}>No approved matches yet</Text>
            <Text style={styles.emptySubtext}>When someone approves your pick request, it will appear here</Text>
          </View>
        ) : (
          approvedMatches.map((match) => (
            <View key={match.matchId} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={[styles.matchStatus, styles.matchStatusApproved]}>APPROVED</Text>
              </View>
              <Text style={styles.matchInfo}>
                {match.pickerId === user?.userId
                  ? `You are picking ${match.requesterName || 'Unknown'}`
                  : `${match.pickerName} is coming to pick you`}
              </Text>
              <Text style={styles.matchDate}>
                Picked you on: {match.approvedAt ? new Date(match.approvedAt).toLocaleDateString() : 'N/A'}
              </Text>
              <TouchableOpacity
                style={styles.trackButton}
                onPress={() => handleStartTracking(match)}>
                <MaterialIcons name="navigation" size={20} color="#FFFFFF" />
                <Text style={styles.trackButtonText}>Pick Now</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{myPickRequests.length}</Text>
            <Text style={styles.statLabel}>Pick Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{approvedMatches.length}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingMatches.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1C39',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 32,
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#5213FE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#2A2540',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5213FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: '#2A2540',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
  },
  requestActivity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5213FE',
    marginBottom: 4,
  },
  requestStatus: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  requestSubject: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  requestDuration: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  matchCard: {
    backgroundColor: '#2A2540',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFA500',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  matchStatusApproved: {
    color: '#4CAF50',
  },
  matchInfo: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 12,
  },
  trackButton: {
    backgroundColor: '#5213FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#2A2540',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#5213FE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2540',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5213FE',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    textTransform: 'uppercase',
  },
});
