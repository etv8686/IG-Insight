import { useState, useRef, useMemo, useEffect } from "react";
import { useVirtual } from "react-virtual";
import Dropzone from "./Dropzone";
import { extractUsernames } from "../../lib/parse/extractUsernames";
import { diff, inter } from "../../lib/diff/setOps";
import { exportCsv, exportJson, exportTxt } from "../../lib/csv/exportCsv";

type AppState = 'idle' | 'loading' | 'success' | 'error';
type AppError = {
  type: 'file_invalid' | 'file_format' | 'analysis_failed';
  message: string;
  details?: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ComparePage() {
  const [followersFile, setFollowersFile] = useState<File | null>(null);
  const [followingFile, setFollowingFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<AppError | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [unfollowers, setUnfollowers] = useState<string[]>([]);
  const [notFollowingBack, setNotFollowingBack] = useState<string[]>([]);
  const [mutual, setMutual] = useState<string[]>([]);

  const stats = useMemo(() => {
    if (followers.length === 0 && following.length === 0) return null;
    
    return {
      followers: followers.length,
      following: following.length,
      unfollowers: unfollowers.length,
      notFollowingBack: notFollowingBack.length,
      mutual: mutual.length,
      unfollowerRate: followers.length > 0 ? (unfollowers.length / followers.length * 100).toFixed(1) : '0',
      notFollowingBackRate: following.length > 0 ? (notFollowingBack.length / following.length * 100).toFixed(1) : '0',
      mutualRate: following.length > 0 ? (mutual.length / following.length * 100).toFixed(1) : '0'
    };
  }, [followers, following, unfollowers, notFollowingBack, mutual]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('ig-insights-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.followers) setFollowers(data.followers);
        if (data.following) setFollowing(data.following);
        if (data.unfollowers) setUnfollowers(data.unfollowers);
        if (data.notFollowingBack) setNotFollowingBack(data.notFollowingBack);
        if (data.mutual) setMutual(data.mutual);
        setAppState('success');
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
  }, []);

  // Save data when analysis completes
  useEffect(() => {
    if (appState === 'success' && stats) {
      const dataToSave = {
        followers,
        following,
        unfollowers,
        notFollowingBack,
        mutual,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('ig-insights-data', JSON.stringify(dataToSave));
    }
  }, [appState, followers, following, unfollowers, notFollowingBack, mutual, stats]);

  async function readJson(file?: File): Promise<{ data: any; error: AppError | null }> {
    if (!file) {
      return { data: null, error: { type: 'file_invalid', message: 'No file selected' } };
    }

    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      
      // Basic validation for Instagram export format
      if (typeof data !== 'object' || data === null) {
        return { 
          data: null, 
          error: { 
            type: 'file_format', 
            message: 'Invalid file format', 
            details: 'The file must contain a valid JSON object' 
          } 
        };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { 
          type: 'file_invalid', 
          message: 'Invalid JSON file', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }

  async function onCompare() {
    if (!followersFile || !followingFile) {
      setError({ type: 'file_invalid', message: 'Please select both followers and following files' });
      return;
    }

    setAppState('loading');
    setError(null);
    setProcessingProgress(0);

    try {
      // Read and validate files
      setProcessingProgress(20);
      const [followersResult, followingResult] = await Promise.all([
        readJson(followersFile),
        readJson(followingFile)
      ]);

      if (followersResult.error) {
        setError(followersResult.error);
        setAppState('error');
        return;
      }

      if (followingResult.error) {
        setError(followingResult.error);
        setAppState('error');
        return;
      }

      // Extract usernames
      setProcessingProgress(40);
      const followersList = extractUsernames(followersResult.data);
      const followingList = extractUsernames(followingResult.data);

      if (followersList.length === 0) {
        setError({ 
          type: 'analysis_failed', 
          message: 'No followers found in the file', 
          details: 'Make sure you selected the correct followers file' 
        });
        setAppState('error');
        return;
      }

      if (followingList.length === 0) {
        setError({ 
          type: 'analysis_failed', 
          message: 'No following found in the file', 
          details: 'Make sure you selected the correct following file' 
        });
        setAppState('error');
        return;
      }

      // Perform analysis
      setProcessingProgress(60);
      const unfollowersList = diff(followersList, followingList);
      const notFollowingBackList = diff(followingList, followersList);
      const mutualList = inter(followersList, followingList);

      // Update state
      setProcessingProgress(80);
      setFollowers(followersList);
      setFollowing(followingList);
      setUnfollowers(unfollowersList);
      setNotFollowingBack(notFollowingBackList);
      setMutual(mutualList);

      setProcessingProgress(100);
      setAppState('success');
    } catch (error) {
      setError({ 
        type: 'analysis_failed', 
        message: 'Analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
      setAppState('error');
    }
  }

  function exportData(format: 'csv' | 'json' | 'txt', data: string[], filename: string) {
    switch (format) {
      case 'csv':
        exportCsv(filename, data);
        break;
      case 'json':
        exportJson(filename, data);
        break;
      case 'txt':
        exportTxt(filename, data);
        break;
    }
  }

  function clearData() {
    setFollowers([]);
    setFollowing([]);
    setUnfollowers([]);
    setNotFollowingBack([]);
    setMutual([]);
    setAppState('idle');
    setError(null);
    localStorage.removeItem('ig-insights-data');
  }

  function List({ list, title }: { list: string[]; title: string }) {
    const [q, setQ] = useState("");
    const debouncedQuery = useDebounce(q, 300);
    const parentRef = useRef<HTMLDivElement>(null);
    
    const filtered = useMemo(() => {
      const s = debouncedQuery.trim().toLowerCase();
      return s ? list.filter(u => u.includes(s)) : list;
    }, [list, debouncedQuery]);

    const virtualizer = useVirtual({
      size: filtered.length,
      parentRef,
      estimateSize: () => 32,
      overscan: 5,
    });

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{title}</h3>
          <span className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
            {filtered.length} / {list.length}
          </span>
        </div>
        
        <input
          aria-label={`Search in ${title}`}
          className="input"
          placeholder="Search for a username..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        
        <div 
          ref={parentRef}
          className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-soft"
          style={{ height: '50vh' }}
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm">
                {q ? 'No results found' : 'No items'}
              </p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.totalSize}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.virtualItems.map((virtualItem: any) => (
                <div
                  key={virtualItem.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="py-3 px-4 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                    <span className="text-slate-600 dark:text-slate-400">@</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {filtered[virtualItem.index]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            IG Insights
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Discover your Instagram relationships privately and securely
          </p>
          
          <div className="flex justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">🔒</span>
              <span>100% Private</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-blue-400">⚡</span>
              <span>Fast Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-purple-400">📊</span>
              <span>Detailed Insights</span>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Dropzone
            label="Upload Followers File"
            accept=".json"
            onFile={setFollowersFile}
            file={followersFile}
          />
          <Dropzone
            label="Upload Following File"
            accept=".json"
            onFile={setFollowingFile}
            file={followingFile}
          />
        </div>

        {/* Analysis Button */}
        <div className="text-center mb-8">
        <button
          onClick={onCompare}
            disabled={appState === 'loading' || !followersFile || !followingFile}
            className="btn btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {appState === 'loading' ? (
              <>
                <span className="animate-spin mr-2">🔄</span>
                Analyzing... {processingProgress}%
              </>
            ) : (
              <>
                <span className="mr-2">🔍</span>
                Discover My Insights
              </>
            )}
        </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card glass border-red-500 bg-red-50/10 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-400 mb-1">{error.message}</h3>
                {error.details && (
                  <p className="text-red-300 text-sm">{error.details}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {appState === 'success' && stats && (
          <div className="space-y-8">
            {/* Statistics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="stat-card">
                <div className="stat-number">{stats.followers}</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.following}</div>
                <div className="stat-label">Following</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.unfollowers}</div>
                <div className="stat-label">Unfollowers ({stats.unfollowerRate}%)</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.notFollowingBack}</div>
                <div className="stat-label">Not Following Back ({stats.notFollowingBackRate}%)</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.mutual}</div>
                <div className="stat-label">Mutual ({stats.mutualRate}%)</div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="card glass">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Export Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-300">Unfollowers</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportData('csv', unfollowers, 'unfollowers.csv')}
                      className="btn btn-secondary text-sm"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportData('json', unfollowers, 'unfollowers.json')}
                      className="btn btn-secondary text-sm"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => exportData('txt', unfollowers, 'unfollowers.txt')}
                      className="btn btn-secondary text-sm"
                    >
                      TXT
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-300">Not Following Back</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportData('csv', notFollowingBack, 'not-following-back.csv')}
                      className="btn btn-secondary text-sm"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportData('json', notFollowingBack, 'not-following-back.json')}
                      className="btn btn-secondary text-sm"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => exportData('txt', notFollowingBack, 'not-following-back.txt')}
                      className="btn btn-secondary text-sm"
                    >
                      TXT
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-300">Mutual</h4>
                  <div className="flex gap-2">
        <button
                      onClick={() => exportData('csv', mutual, 'mutual.csv')}
                      className="btn btn-secondary text-sm"
        >
                      CSV
        </button>
        <button
                      onClick={() => exportData('json', mutual, 'mutual.json')}
                      className="btn btn-secondary text-sm"
        >
                      JSON
        </button>
        <button
                      onClick={() => exportData('txt', mutual, 'mutual.txt')}
                      className="btn btn-secondary text-sm"
        >
                      TXT
        </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lists */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="list-card">
                <List list={unfollowers} title="People who unfollowed you" />
              </div>
              <div className="list-card">
                <List list={notFollowingBack} title="People you follow but don't follow back" />
              </div>
            </div>

            <div className="list-card">
              <List list={mutual} title="Mutual connections" />
      </div>

            {/* Clear Data Button */}
            <div className="text-center">
              <button
                onClick={clearData}
                className="btn btn-ghost text-red-400 hover:text-red-300"
              >
                Clear All Data
              </button>
        </div>
        </div>
        )}
        </div>
    </div>
  );
}